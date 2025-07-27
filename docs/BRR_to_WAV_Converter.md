# BRR to WAV Converter

A robust implementation of BRR (Bit Rate Reduction) to WAV audio conversion based on the SNES9x emulator implementation and official SNES development documentation.

## Features

### ✅ Completed Features

- **BRR Decompression Algorithm**: Full implementation based on SNES9x source code
- **Proper BRR Filtering**: All 4 BRR filter types implemented with correct coefficients
- **ADSR Envelope Support**: Complete ADSR envelope processor with attack, decay, sustain, and release phases
- **Pitch Data Processing**: 2.12 fixed-point pitch adjustment with interpolation
- **16-bit PCM Generation**: Proper sample clamping and scaling
- **WAV Export**: Standard WAV format export with proper headers
- **Loop Point Preservation**: Loop metadata preserved in companion files
- **Batch Conversion**: Support for converting multiple BRR files at once
- **Command Line Interface**: Full-featured CLI with comprehensive options

### Technical Implementation

#### BRR Format Support
- **Block Structure**: 9-byte blocks (1 header + 8 data bytes = 16 samples)
- **Filter Types**: All 4 ADPCM filters with proper coefficients:
  - Filter 0: Direct (no filtering)
  - Filter 1: 15/16 * sample[-1]
  - Filter 2: 61/32 * sample[-1] - 15/16 * sample[-2]  
  - Filter 3: 115/64 * sample[-1] - 13/16 * sample[-2]
- **Loop Support**: End and loop flags properly handled
- **Shift Values**: Full 0-15 shift range with proper clamping

#### ADSR Envelope Processing
Based on S-DSP register documentation:
- **Attack Phase**: Linear or exponential increase based on rate
- **Decay Phase**: Exponential decrease to sustain level
- **Sustain Phase**: Configurable sustain rate
- **Release Phase**: Linear decrease at -8 per sample

#### Audio Quality Features
- **Sample Rate**: Native 32kHz SNES sample rate
- **Bit Depth**: 16-bit signed PCM output
- **Interpolation**: Gaussian-style interpolation for pitch adjustment
- **Clamping**: Proper 16-bit range clamping to prevent overflow

## Usage

### Command Line Interface

```bash
# Convert single BRR file
python brr_converter.py sample.brr output.wav

# Batch convert directory
python brr_converter.py --batch input_samples/ output_wav/

# Convert with custom pitch (double speed)
python brr_converter.py --pitch 0x2000 sample.brr output.wav

# Convert with ADSR envelope (attack=10, decay=5, sustain_level=4, sustain_rate=2)
python brr_converter.py --adsr 10,5,4,2 sample.brr output.wav

# Run built-in tests
python brr_converter.py --test
```

### Python API

```python
from BRRDecoder import BRRDecoder

# Basic conversion
with open('sample.brr', 'rb') as f:
    brr_data = f.read()

decoder = BRRDecoder(brr_data)
decoder.export_to_wav('output.wav')

# Advanced conversion with ADSR
adsr_params = {
    'attack_rate': 10,
    'decay_rate': 5, 
    'sustain_level': 4,
    'sustain_rate': 2
}

decoder = BRRDecoder(brr_data, pitch=0x1000, adsr_params=adsr_params)
samples = decoder.decode()
decoder.export_to_wav('output.wav', preserve_loop_points=True)

# Batch processing
decoder.batch_convert('input_dir/', 'output_dir/')
```

## Technical Details

### BRR Format Structure

Each BRR block consists of:
```
Byte 0: Header (SSSS FFLE)
  - SSSS: Left-shift amount (0-15)
  - FF: Filter type (0-3)
  - L: Loop flag
  - E: End flag

Bytes 1-8: Sample data (16 4-bit samples, high nibble first)
```

### Filter Coefficients

Based on official SNES development documentation:

| Filter | Coefficient 1 | Coefficient 2 | Description |
|--------|---------------|---------------|-------------|
| 0      | 0             | 0             | Direct (no filter) |
| 1      | 15/16         | 0             | Simple smoothing |
| 2      | 61/32         | -15/16        | Two-tap prediction |
| 3      | 115/64        | -13/16        | Enhanced prediction |

### ADSR Envelope Stages

1. **Attack**: Linear increase at configurable rate
2. **Decay**: Exponential decrease to sustain level  
3. **Sustain**: Holds at sustain level with optional slow decay
4. **Release**: Linear decrease at -8 per sample

### Memory Layout

The decoder maintains:
- 16-sample circular buffer for BRR processing
- 2-sample history for filter calculations
- ADSR state machine with envelope tracking
- Loop point information for seamless playback

## File Output

### WAV Format
- **Format**: PCM WAV
- **Sample Rate**: 32,000 Hz
- **Bit Depth**: 16-bit signed
- **Channels**: Mono
- **Byte Order**: Little-endian

### Loop Point Metadata
When `preserve_loop_points=True`:
- Creates companion `.txt` file with loop information
- Contains loop start position, loop enable flag, and total samples
- Future enhancement planned for embedded WAV cue chunks

## Testing

The converter includes comprehensive tests:

```bash
python brr_converter.py --test
```

Tests cover:
- Basic BRR decoding with synthetic data
- ADSR envelope application
- Pitch adjustment and interpolation
- WAV file export
- Error handling and edge cases

## Implementation Notes

### Based on SNES9x Source
The implementation closely follows the SNES9x `decode_brr()` function from `SPC_DSP.cpp`, ensuring accuracy to the original hardware behavior.

### Wiki Documentation Compliance
Filter coefficients and ADSR behavior match the official SNES development wiki specifications.

### Performance Considerations
- Efficient block-by-block processing
- Minimal memory allocation during conversion
- Optimized filter calculations using integer arithmetic

## Future Enhancements

Potential improvements:
- True Gaussian interpolation (currently using linear)
- Embedded WAV cue chunk support for loop points
- Support for stereo BRR samples
- Advanced noise generation for test data
- Integration with SNES ROM audio extraction

## Dependencies

- `numpy`: For efficient array operations
- `wave`: For WAV file generation
- Standard library modules: `struct`, `os`, `glob`, `argparse`

## License

This implementation is based on publicly available SNES development documentation and the open-source SNES9x emulator. See individual source files for specific licensing terms.
