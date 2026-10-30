import unittest
from copy import deepcopy
from unittest.mock import Mock

from karaoke_worker.fine_alignment import fine_alignment_result, phrase_window, refine_provided_phrases


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

    def test_missing_number_timing_is_recovered_between_valid_words(self):
        result = fine_alignment_result(
            "Tenho 23 anos",
            [{"word": "Tenho", "start": 0.2, "end": 0.6},
             {"word": "23"},
             {"word": "anos", "start": 1.1, "end": 1.5}],
            10.0, 3.0,
        )
        self.assertEqual(result["words"], [
            {"text": "Tenho", "start": 10200, "end": 10600},
            {"text": "23", "start": 10600, "end": 11100},
            {"text": "anos", "start": 11100, "end": 11500},
        ])

    def test_multiple_missing_words_share_available_time_by_text_length(self):
        result = fine_alignment_result(
            "a 22 3333 b",
            [{"start": 0.1, "end": 0.5}, {}, {}, {"start": 1.7, "end": 2.0}],
            0, 3,
        )
        self.assertEqual(result["words"][1:3], [
            {"text": "22", "start": 500, "end": 900},
            {"text": "3333", "start": 900, "end": 1700},
        ])

    def test_missing_edge_words_use_original_phrase_bounds_inside_padded_audio(self):
        result = fine_alignment_result(
            "23 anos 24", [{}, {"start": 1.4, "end": 1.8}, {}],
            10, 4, bounds=(1.0, 2.5),
        )
        self.assertEqual(result["start"], 11000)
        self.assertEqual(result["end"], 12500)
        self.assertEqual(result["words"][1], {"text": "anos", "start": 11400, "end": 11800})

    def test_partial_word_timestamps_are_preserved(self):
        result = fine_alignment_result(
            "one two three", [{"start": 0.2}, {"start": 1, "end": 1.5}, {"end": 2.8}],
            0, 3,
        )
        self.assertEqual(result["words"], [
            {"text": "one", "start": 200, "end": 1000},
            {"text": "two", "start": 1000, "end": 1500},
            {"text": "three", "start": 1500, "end": 2800},
        ])

    def test_no_acoustic_anchors_does_not_invent_alignment(self):
        with self.assertRaisesRegex(ValueError, "reliable word timings"):
            fine_alignment_result("23 45", [{}, {}], 0, 3)

    def test_nonfinite_and_reversed_timings_are_rejected(self):
        for words in (
            [{"start": float("nan"), "end": 1}, {"start": 1.1, "end": 2}],
            [{"start": 1, "end": 1.5}, {"start": 0.2, "end": 0.8}],
        ):
            with self.subTest(words=words), self.assertRaises(ValueError):
                fine_alignment_result("hello world", words, 0, 3)

    def test_incomplete_alignment_does_not_replace_phrase(self):
        with self.assertRaisesRegex(ValueError, "every word"):
            fine_alignment_result(
                "Hello world", [{"start": 0.4, "end": 0.8}], 1.0, 3.0
            )


class ProvidedPhraseRefinementTests(unittest.TestCase):
    def phrases(self):
        return [
            {
                "id": f"phrase-{index}", "text": "Hello world",
                "start": start, "end": start + 1500,
                "alignment_status": "approximate", "confidence": 0.0,
                "search_start": 0, "search_end": 10000,
                "words": [
                    {"id": f"word-{index}-1", "text": "Hello", "start": start, "end": start + 500},
                    {"id": f"gap-{index}", "type": "gap", "text": "", "start": start + 500, "end": start + 1000},
                    {"id": f"word-{index}-2", "text": "world", "start": start + 1000, "end": start + 1500},
                ],
            }
            for index, start in enumerate((2000, 5000, 8000))
        ]

    def result(self, start):
        return {
            "start": start, "end": start + 1000,
            "words": [
                {"text": "Hello", "start": start, "end": start + 400},
                {"text": "world", "start": start + 500, "end": start + 1000},
            ],
        }

    def test_every_phrase_refined_with_original_windows_and_ids_preserved(self):
        phrases = self.phrases()
        original = deepcopy(phrases)
        align = Mock(side_effect=[self.result(2200), self.result(5200), self.result(8200)])
        progress = Mock()
        refined = refine_provided_phrases(phrases, align, progress)
        self.assertEqual([call.args[0] for call in align.call_args_list], original)
        self.assertEqual(phrases, original)
        self.assertEqual([p["start"] for p in refined], [2200, 5200, 8200])
        self.assertEqual([p["id"] for p in refined], [p["id"] for p in phrases])
        self.assertTrue(all(p["alignment_status"] == "aligned" for p in refined))
        self.assertEqual([w["id"] for w in refined[0]["words"]], ["word-0-1", "word-0-2"])
        self.assertEqual(refined[0]["words"][1]["start"], 2600)
        self.assertEqual([call.args for call in progress.call_args_list], [(1, 3), (2, 3), (3, 3)])

    def test_incomplete_phrase_retained_and_later_phrases_still_refined(self):
        phrases = self.phrases()
        align = Mock(side_effect=[self.result(2200), ValueError("Incomplete timings"), self.result(8200)])
        refined = refine_provided_phrases(phrases, align, Mock())
        self.assertEqual(refined[1], phrases[1])
        self.assertEqual(refined[2]["start"], 8200)

    def test_crossing_neighbor_boundaries_retains_original_timing(self):
        phrases = self.phrases()
        align = Mock(side_effect=[self.result(4500), self.result(3000), self.result(8200)])
        refined = refine_provided_phrases(phrases, align, Mock())
        self.assertEqual(refined[:2], phrases[:2])
        self.assertEqual(refined[2]["start"], 8200)

    def test_runtime_failure_propagates_for_device_fallback(self):
        with self.assertRaisesRegex(RuntimeError, "CUDA"):
            refine_provided_phrases(self.phrases(), Mock(side_effect=RuntimeError("CUDA failure")), Mock())


if __name__ == "__main__":
    unittest.main()
