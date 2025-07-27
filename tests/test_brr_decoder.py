import unittest
from BRRDecoder import BRRDecoder

class TestBRRDecoder(unittest.TestCase):
    def setUp(self):
        # This is where you'd normally load or set up any common resources
        self.test_brr_data = self.create_test_brr_data()

    def create_test_brr_data(self) -> bytes:
        """Creates a simple test BRR data for testing purposes."""
        # Dummy BRR block with simple pattern
        # First byte is header: shift=0, filter=0, no loop, no end
        data = bytearray([0x00] + [0x55] * 8)  # 0x55 for simplicity in all nibbles
        return bytes(data)

    def test_basic_brr_decoding(self):
        decoder = BRRDecoder(self.test_brr_data)
        samples = decoder.decode()
        
        # Here we check if the decoded samples match expected output
        # For simplicity, expected samples might just be placeholders
        expected_samples = [0] * 16
        self.assertEqual(samples, expected_samples)

    def test_brr_decompression(self):
        decoder = BRRDecoder(self.test_brr_data)
        samples = decoder.decode()

        # Test if the decoded output length matches the expected length
        self.assertEqual(len(samples), 16)

if __name__ == '__main__':
    unittest.main()

