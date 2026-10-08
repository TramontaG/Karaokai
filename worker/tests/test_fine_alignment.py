import unittest

from karaoke_worker.fine_alignment import fine_alignment_result, phrase_window


class FineAlignmentTests(unittest.TestCase):
    def test_window_adds_one_second_on_each_side_and_clamps_to_audio(self):
        self.assertEqual(phrase_window(2000, 3500, 10), (1.0, 4.5))
        self.assertEqual(phrase_window(200, 9500, 10), (0.0, 10))

    def test_word_timings_return_to_absolute_timeline(self):
        result = fine_alignment_result(
            "Hello world",
            [
                {"word": "Hello", "start": 0.4, "end": 0.85},
                {"word": "world", "start": 1.0, "end": 1.5},
            ],
            offset=1.0,
            duration=3.0,
        )
        self.assertEqual(
            result,
            {
                "start": 1400,
                "end": 2500,
                "words": [
                    {"text": "Hello", "start": 1400, "end": 1850},
                    {"text": "world", "start": 2000, "end": 2500},
                ],
            },
        )

    def test_incomplete_alignment_does_not_replace_phrase(self):
        with self.assertRaisesRegex(ValueError, "every word"):
            fine_alignment_result(
                "Hello world", [{"start": 0.4, "end": 0.8}], 1.0, 3.0
            )


if __name__ == "__main__":
    unittest.main()
