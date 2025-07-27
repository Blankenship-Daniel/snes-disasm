#!/usr/bin/env python3
"""
BRR to WAV Converter - Command Line Interface
Based on SNES9x BRR decompression algorithm with ADSR envelope support

Usage:
    python brr_converter.py input.brr output.wav
    python brr_converter.py --batch input_dir output_dir
    python brr_converter.py --test
"""

import argparse
import sys
import os
from pathlib import Path
from BRRDecoder import BRRDecoder, ADSREnvelope

def create_test_brr_data() -> bytes:
    """Create a simple test BRR sample for validation."""
    # Simple test pattern: filter 0, no loop, increasing samples
    test_data = bytearray()
    
    # Block 1: Filter 0, no loop/end
    test_data.append(0x00)  # Header: shift=0, filter=0, no loop, no end
    for i in range(8):
        # Create alternating nibbles: 0x01, 0x23, 0x45, etc.
        test_data.append((i * 2 + 1) << 4 | (i * 2 + 2))
    
    # Block 2: Filter 0, end flag set
    test_data.append(0x01)  # Header: shift=0, filter=0, no loop, end=1
    for i in range(8):
        # Decreasing pattern
        test_data.append(((7 - i) * 2 + 1) << 4 | ((7 - i) * 2))
    
    return bytes(test_data)

def test_brr_decoder():
    """Test the BRR decoder with various configurations."""
    print("Testing BRR Decoder...")
    
    # Create test data
    test_data = create_test_brr_data()
    print(f"Created test BRR data: {len(test_data)} bytes")
    
    # Test 1: Basic decoding
    print("\nTest 1: Basic BRR decoding")
    decoder = BRRDecoder(test_data)
    samples = decoder.decode()
    print(f"Decoded {len(samples)} samples")
    print(f"First 10 samples: {samples[:10]}")
    
    # Test 2: With ADSR envelope
    print("\nTest 2: BRR decoding with ADSR envelope")
    adsr_params = {
        'attack_rate': 10,
        'decay_rate': 5,
        'sustain_level': 4,
        'sustain_rate': 2
    }
    decoder_adsr = BRRDecoder(test_data, adsr_params=adsr_params)
    samples_adsr = decoder_adsr.decode()
    print(f"Decoded {len(samples_adsr)} samples with ADSR")
    print(f"First 10 samples with ADSR: {samples_adsr[:10]}")
    
    # Test 3: Export to WAV
    print("\nTest 3: Export to WAV file")
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    
    wav_file = os.path.join(output_dir, "test_basic.wav")
    decoder.export_to_wav(wav_file)
    print(f"Exported basic sample to: {wav_file}")
    
    wav_file_adsr = os.path.join(output_dir, "test_adsr.wav")
    decoder_adsr.export_to_wav(wav_file_adsr, preserve_loop_points=True)
    print(f"Exported ADSR sample to: {wav_file_adsr}")
    
    # Test 4: Pitch adjustment
    print("\nTest 4: Pitch adjustment")
    decoder_pitch = BRRDecoder(test_data, pitch=0x2000)  # Double pitch
    samples_pitch = decoder_pitch.decode()
    final_pitch = decoder_pitch.apply_gaussian_interpolation(samples_pitch)
    print(f"Pitch-adjusted samples: {len(final_pitch)} (from {len(samples_pitch)})")
    
    wav_file_pitch = os.path.join(output_dir, "test_pitch.wav")
    decoder_pitch.export_to_wav(wav_file_pitch)
    print(f"Exported pitched sample to: {wav_file_pitch}")
    
    print("\nAll tests completed successfully!")
    return True

def convert_single_file(input_file: str, output_file: str, 
                       pitch: int = 0x1000, adsr_params: dict = None):
    """Convert a single BRR file to WAV."""
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found")
        return False
    
    try:
        with open(input_file, 'rb') as f:
            brr_data = f.read()
        
        print(f"Loading BRR file: {input_file} ({len(brr_data)} bytes)")
        
        decoder = BRRDecoder(brr_data, pitch=pitch, adsr_params=adsr_params)
        decoder.export_to_wav(output_file, preserve_loop_points=True)
        
        print(f"Successfully converted to: {output_file}")
        return True
        
    except Exception as e:
        print(f"Error converting {input_file}: {e}")
        return False

def batch_convert(input_dir: str, output_dir: str):
    """Convert all BRR files in a directory."""
    if not os.path.exists(input_dir):
        print(f"Error: Input directory '{input_dir}' not found")
        return False
    
    # Create a dummy decoder for batch processing
    dummy_decoder = BRRDecoder(b'')
    converted_count = dummy_decoder.batch_convert(input_dir, output_dir)
    
    print(f"Batch conversion completed: {converted_count} files converted")
    return converted_count > 0

def main():
    parser = argparse.ArgumentParser(
        description="Convert SNES BRR audio samples to WAV format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Convert single file:
    python brr_converter.py sample.brr output.wav
    
  Batch convert directory:
    python brr_converter.py --batch input_samples/ output_wav/
    
  Convert with custom pitch (2x speed):
    python brr_converter.py --pitch 0x2000 sample.brr output.wav
    
  Convert with ADSR envelope:
    python brr_converter.py --adsr 10,5,4,2 sample.brr output.wav
    
  Run tests:
    python brr_converter.py --test
        """
    )
    
    parser.add_argument('input', nargs='?', help='Input BRR file or directory')
    parser.add_argument('output', nargs='?', help='Output WAV file or directory')
    
    parser.add_argument('--batch', action='store_true',
                       help='Batch convert all BRR files in input directory')
    parser.add_argument('--test', action='store_true',
                       help='Run built-in tests')
    parser.add_argument('--pitch', type=str, default='0x1000',
                       help='Pitch value in hex (default: 0x1000 = normal speed)')
    parser.add_argument('--adsr', type=str,
                       help='ADSR parameters as attack,decay,sustain_level,sustain_rate')
    
    args = parser.parse_args()
    
    # Handle test mode
    if args.test:
        return 0 if test_brr_decoder() else 1
    
    # Validate arguments
    if not args.input or not args.output:
        if not args.test:
            parser.print_help()
            return 1
    
    # Parse pitch value
    try:
        if args.pitch.startswith('0x'):
            pitch = int(args.pitch, 16)
        else:
            pitch = int(args.pitch)
    except ValueError:
        print(f"Error: Invalid pitch value '{args.pitch}'")
        return 1
    
    # Parse ADSR parameters
    adsr_params = None
    if args.adsr:
        try:
            adsr_values = [int(x.strip()) for x in args.adsr.split(',')]
            if len(adsr_values) != 4:
                raise ValueError("ADSR must have 4 values")
            adsr_params = {
                'attack_rate': adsr_values[0],
                'decay_rate': adsr_values[1],
                'sustain_level': adsr_values[2],
                'sustain_rate': adsr_values[3]
            }
        except ValueError as e:
            print(f"Error: Invalid ADSR parameters '{args.adsr}': {e}")
            return 1
    
    # Handle batch mode
    if args.batch:
        success = batch_convert(args.input, args.output)
        return 0 if success else 1
    
    # Handle single file conversion
    success = convert_single_file(args.input, args.output, pitch, adsr_params)
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
