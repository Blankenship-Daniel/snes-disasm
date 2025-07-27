import unittest
from BRRDecoder import BRRDecoder
from brr_converter import create_test_brr_data

class TestAudioIntegration(unittest.TestCase):
    def setUp(self):
        self.test_data = create_test_brr_data()

    def test_integration_with_known_rom(self):
        decoder = BRRDecoder(self.test_data)
        samples = decoder.decode()

        # Expected samples based on known decoding
        expected_samples = [0] * 16

        self.assertEqual(samples, expected_samples)

if __name__ == '__main__':
    unittest.main()
