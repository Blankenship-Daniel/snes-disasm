import unittest
import wave
import numpy as np

class TestWAVExportQuality(unittest.TestCase):
    def setUp(self):
        self.output_wav_file = "output/test_basic.wav"

    def test_wav_quality(self):
        with wave.open(self.output_wav_file, 'rb') as wav:
            self.assertEqual(wav.getnchannels(), 1)  # Mono
            self.assertEqual(wav.getsampwidth(), 2)  # 16-bit
            self.assertEqual(wav.getframerate(), 32000)  # 32kHz

            frames = wav.readframes(wav.getnframes())
            samples = np.frombuffer(frames, dtype=np.int16)

            # Check for clipping
            self.assertFalse(np.any(samples > 32767) or np.any(samples < -32768))

if __name__ == '__main__':
    unittest.main()
