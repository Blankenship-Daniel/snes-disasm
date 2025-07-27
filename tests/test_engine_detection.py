import unittest
from BRRDecoder import BRRDecoder
from extract_audio import extract_audio

class TestEngineDetection(unittest.TestCase):
    def setUp(self):
        # Example data, in practice you'd have real ROM data
        self.mock_rom_data = [{'data': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'name': 'Game1'},
                              {'data': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], 'name': 'Game2'}]

    def test_detect_engines(self):
        for rom in self.mock_rom_data:
            with self.subTest(rom=rom['name']):
                result = extract_audio(data=rom['data'], operation='spc700')
                self.assertIn('format', result)

if __name__ == '__main__':
    unittest.main()
