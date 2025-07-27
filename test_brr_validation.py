import os
from BRRDecoder import BRRDecoder

# Directory containing SNES ROMs
games_dir = './snes_games/'
# Output directory for test results
output_dir = './output/'

# Create output directory if not exists
os.makedirs(output_dir, exist_ok=True)

# Traverse each ROM file
for root, dirs, files in os.walk(games_dir):
    for file in files:
        if file.endswith('.sfc') or file.endswith('.smc'):
            rom_path = os.path.join(root, file)
            print(f"Testing BRR sample decoding for ROM: {rom_path}")
            
            try:
                with open(rom_path, 'rb') as rom_file:
                    rom_data = rom_file.read()
                    decoder = BRRDecoder(rom_data)
                    samples = decoder.decode()
                    print(f"Decoded {len(samples)} samples for {file}")
                    
                    # Write output to WAV for verification
                    wav_output = os.path.join(output_dir, file.replace('.sfc', '.wav').replace('.smc', '.wav'))
                    decoder.export_to_wav(wav_output)
                    print(f"Exported WAV to {wav_output}")
            except Exception as e:
                print(f"Error processing {file}: {e}")

print("BRR sample validation testing complete.")
