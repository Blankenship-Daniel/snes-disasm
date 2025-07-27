import wave
import struct
import numpy as np
from typing import List, Optional, Tuple
import os

# Constants based on SNES9x implementation and wiki documentation
BRR_BLOCK_SIZE = 9
SAMPLE_RATE = 32000
CHANNELS = 2
DEFAULT_AMP = 0x180
MAX_INT16 = 32767
MIN_INT16 = -32768
BRR_BUF_SIZE = 16  # 16 sample circular buffer for BRR decoding

# BRR Filter coefficients based on wiki documentation
BRR_FILTER_COEFFS = [
    [0, 0],       # Filter 0: no filter
    [15/16, 0],   # Filter 1: 15/16 * sample[-1]
    [61/32, -15/16],  # Filter 2: 61/32 * sample[-1] - 15/16 * sample[-2]
    [115/64, -13/16]  # Filter 3: 115/64 * sample[-1] - 13/16 * sample[-2]
]

# ADSR envelope implementation
class ADSREnvelope:
    """ADSR envelope processor based on S-DSP documentation."""
    
    def __init__(self, attack_rate: int = 15, decay_rate: int = 7, 
                 sustain_level: int = 7, sustain_rate: int = 0):
        self.attack_rate = attack_rate
        self.decay_rate = decay_rate
        self.sustain_level = sustain_level
        self.sustain_rate = sustain_rate
        
        # ADSR state
        self.state = 'attack'  # attack, decay, sustain, release
        self.envelope = 0
        self.enabled = True
        
    def process_sample(self) -> float:
        """Process one sample and return envelope multiplier (0.0 to 1.0)."""
        if not self.enabled:
            return 1.0
            
        if self.state == 'attack':
            if self.attack_rate == 15:
                self.envelope += 1024  # Linear increase +1024 at rate 31
            else:
                self.envelope += 32    # Linear increase +32 at specified rate
            
            if self.envelope >= 2047:  # Max envelope value
                self.envelope = 2047
                self.state = 'decay'
                
        elif self.state == 'decay':
            # Exponential decrease
            self.envelope -= max(1, (self.envelope - 1) >> 8)
            
            # Check if we've reached sustain level
            if (self.envelope >> 8) <= self.sustain_level:
                self.state = 'sustain'
                
        elif self.state == 'sustain':
            if self.sustain_rate > 0:
                # Exponential decrease at sustain rate
                self.envelope -= max(1, (self.envelope - 1) >> 8)
                
        elif self.state == 'release':
            # Linear decrease at fixed rate of -8
            self.envelope -= 8
            if self.envelope < 0:
                self.envelope = 0
                
        return self.envelope / 2047.0  # Convert to 0.0-1.0 range
    
    def key_on(self):
        """Start a new note (key on)."""
        self.envelope = 0
        self.state = 'attack'
        
    def key_off(self):
        """Release the note (key off)."""
        self.state = 'release'

# Enhanced BRR decoding function
class BRRDecoder:
    """BRR decoder with proper filter implementation and ADSR envelope support."""
    
    def __init__(self, brr_data: bytes, pitch: int = 0x1000, 
                 adsr_params: Optional[dict] = None, amp: int = DEFAULT_AMP):
        self.brr_data = brr_data
        self.pitch = pitch  # Pitch in 2.12 fixed point format
        self.samples = []
        self.amp = amp  # Amplitude/gain control
        
        # BRR decoder state
        self.buf = [0] * (BRR_BUF_SIZE * 2)  # Circular buffer with wrap-around
        self.buf_pos = 0
        self.prev_samples = [0, 0]  # Previous two samples for filtering
        
        # ADSR envelope
        if adsr_params:
            self.adsr = ADSREnvelope(**adsr_params)
        else:
            self.adsr = ADSREnvelope()
            
        # Loop point information
        self.loop_start = 0
        self.loop_enabled = False
        
        # Fade parameters
        self.total_frames = 0
        self.fade_frames = 0
        
    def clamp16(self, value: int) -> int:
        """Clamp value to 16-bit signed range."""
        return max(MIN_INT16, min(MAX_INT16, value))
        
    def decode_brr_block(self, block_data: bytes) -> List[int]:
        """Decode a single 9-byte BRR block into 16 samples."""
        if len(block_data) != BRR_BLOCK_SIZE:
            raise ValueError(f"BRR block must be {BRR_BLOCK_SIZE} bytes")
            
        header = block_data[0]
        shift = header >> 4
        filter_type = (header >> 2) & 0x03
        loop_flag = (header >> 1) & 0x01
        end_flag = header & 0x01
        
        samples = []
        
        # Process 8 data bytes (16 nibbles = 16 samples)
        for i in range(1, BRR_BLOCK_SIZE):
            byte = block_data[i]
            
            # Process high nibble first
            for nibble in [(byte >> 4) & 0x0F, byte & 0x0F]:
                # Sign-extend 4-bit nibble to 16-bit
                if nibble >= 8:
                    nibble -= 16
                    
                # Apply shift
                if shift <= 12:
                    sample = (nibble << shift) >> 1
                else:
                    sample = nibble & ~0x7FF  # Clamp for large shifts
                    
                # Apply BRR filter based on previous samples
                if filter_type > 0:
                    coeff1, coeff2 = BRR_FILTER_COEFFS[filter_type]
                    sample += int(coeff1 * self.prev_samples[0])
                    if filter_type >= 2:
                        sample += int(coeff2 * self.prev_samples[1])
                        
                # Clamp to 16-bit range
                sample = self.clamp16(sample)
                
                # Update previous samples for next iteration
                self.prev_samples[1] = self.prev_samples[0]
                self.prev_samples[0] = sample
                
                samples.append(sample * 2)  # Scale up for final output
                
        return samples, end_flag, loop_flag
        
    def decode(self) -> List[int]:
        """Decode complete BRR data into PCM samples."""
        self.samples = []
        block_index = 0
        
        while block_index + BRR_BLOCK_SIZE <= len(self.brr_data):
            block_data = self.brr_data[block_index:block_index + BRR_BLOCK_SIZE]
            
            try:
                block_samples, end_flag, loop_flag = self.decode_brr_block(block_data)
                
                # Apply ADSR envelope to each sample
                for sample in block_samples:
                    envelope_mult = self.adsr.process_sample()
                    final_sample = int(sample * envelope_mult)
                    self.samples.append(self.clamp16(final_sample))
                    
                # Handle loop and end flags
                if end_flag:
                    if loop_flag and self.loop_enabled:
                        # Loop back to loop start point
                        block_index = self.loop_start
                        continue
                    else:
                        # End of sample
                        break
                        
            except ValueError as e:
                print(f"Error decoding BRR block at index {block_index}: {e}")
                break
                
            block_index += BRR_BLOCK_SIZE
            
        return self.samples
        
    def apply_gaussian_interpolation(self, samples: List[int]) -> List[int]:
        """Apply Gaussian interpolation for pitch adjustment."""
        if self.pitch == 0x1000:  # No pitch adjustment needed
            return samples
            
        # Simple linear interpolation for now - could be enhanced with proper Gaussian
        pitch_ratio = self.pitch / 0x1000
        output_samples = []
        
        pos = 0.0
        while int(pos) < len(samples) - 1:
            idx = int(pos)
            frac = pos - idx
            
            # Linear interpolation between adjacent samples
            interpolated = int(samples[idx] * (1 - frac) + samples[idx + 1] * frac)
            output_samples.append(interpolated)
            
            pos += pitch_ratio
            
        return output_samples
        
    def apply_fade(self, samples: List[int], fade_frames: int) -> List[int]:
        """Apply fade-out effect to samples based on C implementation."""
        if fade_frames <= 0 or len(samples) <= fade_frames:
            return samples
            
        faded_samples = samples.copy()
        frames_remaining = len(samples)
        
        for i in range(len(samples)):
            if frames_remaining - i <= fade_frames:
                # Calculate fade multiplier
                fade_position = fade_frames - (frames_remaining - i)
                fade_multiplier = (fade_frames - fade_position) / fade_frames
                faded_samples[i] = int(faded_samples[i] * fade_multiplier)
                
        return faded_samples
        
    def apply_amplitude(self, samples: List[int]) -> List[int]:
        """Apply amplitude/gain control to samples."""
        if self.amp == DEFAULT_AMP:
            return samples
            
        gain_multiplier = self.amp / DEFAULT_AMP
        return [self.clamp16(int(sample * gain_multiplier)) for sample in samples]
        
    def export_to_wav(self, filename: str, preserve_loop_points: bool = False, 
                     fade_length: int = 0, total_length: int = 0):
        """Export the decompressed samples to a WAV file with proper headers."""
        if not self.samples:
            self.decode()
            
        # Apply pitch adjustment if needed
        final_samples = self.apply_gaussian_interpolation(self.samples)
        
        with wave.open(filename, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(SAMPLE_RATE)  # 32kHz
            
            # Convert to bytes
            wave_data = np.array(final_samples, dtype=np.int16)
            wav_file.writeframes(wave_data.tobytes())
            
        if preserve_loop_points and self.loop_enabled:
            # Add loop point metadata using cue points
            self._add_loop_metadata(filename)
            
    def _add_loop_metadata(self, filename: str):
        """Add loop point metadata to WAV file using cue chunks."""
        # This would require more complex WAV manipulation
        # For now, we'll create a companion .txt file with loop info
        loop_info_file = filename.replace('.wav', '_loop.txt')
        with open(loop_info_file, 'w') as f:
            f.write(f"Loop Start: {self.loop_start}\n")
            f.write(f"Loop Enabled: {self.loop_enabled}\n")
            f.write(f"Total Samples: {len(self.samples)}\n")
            
    def batch_convert(self, input_dir: str, output_dir: str, 
                     file_pattern: str = "*.brr") -> int:
        """Convert multiple BRR files to WAV format."""
        import glob
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        brr_files = glob.glob(os.path.join(input_dir, file_pattern))
        converted_count = 0
        
        for brr_file in brr_files:
            try:
                with open(brr_file, 'rb') as f:
                    brr_data = f.read()
                    
                decoder = BRRDecoder(brr_data)
                
                output_filename = os.path.basename(brr_file).replace('.brr', '.wav')
                output_path = os.path.join(output_dir, output_filename)
                
                decoder.export_to_wav(output_path, preserve_loop_points=True)
                converted_count += 1
                
                print(f"Converted: {brr_file} -> {output_path}")
                
            except Exception as e:
                print(f"Error converting {brr_file}: {e}")
                
        return converted_count

