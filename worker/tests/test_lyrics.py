import unittest

from karaoke_worker.lyrics import MIN_GENERATED_GAP_MS, approximate_line_word_timings, align_token_sequences, build_alignment_regions, extract_temporal_anchors, localize_lyrics, monotonic_timing_blocks, normalize_generated_word_gaps, tokenize_asr, tokenize_lyrics


def asr_words(text, start=0.0, step=0.5):
    words = text.split()
    return [{"start": start, "end": start + len(words) * step, "text": text, "words": [{"word": word, "start": start + index * step, "end": start + (index + 1) * step} for index, word in enumerate(words)]}]


class CoarseLyricsAlignmentTests(unittest.TestCase):
    def plan(self, lyrics, transcription):
        return localize_lyrics(lyrics, asr_words(transcription))

    def test_exact_match_creates_exact_word_anchors(self):
        plan = self.plan("Hello world", "Hello world")
        self.assertEqual(len(plan["anchors"]), 2)
        self.assertEqual([anchor["confidence"] for anchor in plan["anchors"]], [1.0, 1.0])

    def test_partial_word_mismatch_preserves_official_text(self):
        plan = self.plan("Change to something new", "Change to sun")
        self.assertEqual(plan["lines"], ["Change to something new"])
        self.assertEqual([anchor["lyric_token_index"] for anchor in plan["anchors"]], [0, 1])

    def test_one_missing_lyric_line_remains_in_single_region(self):
        plan = self.plan("First alpha\nMissing zyzzyva\nLast omega", "First alpha Last omega")
        self.assertEqual(plan["regions"][1]["lines"], ["Missing zyzzyva", "Last omega"])

    def test_several_consecutive_missing_lines_are_not_split_into_windows(self):
        plan = self.plan("Anchor one\nMissing two\nMissing three\nAnchor four", "Anchor one Anchor four")
        self.assertEqual(plan["regions"][1]["lines"], ["Missing two", "Missing three", "Anchor four"])
        self.assertGreater(plan["regions"][1]["end"] - plan["regions"][1]["start"], 0)

    def test_extra_asr_block_uses_one_affine_gap_and_keeps_later_anchor(self):
        lines, official = tokenize_lyrics("Start here\nEnd there")
        asr = tokenize_asr(asr_words("Start here extra live banter repeated words End there"))
        anchors = extract_temporal_anchors(align_token_sequences(official, asr), asr)
        self.assertEqual(lines, ["Start here", "End there"])
        self.assertEqual([anchor["lyric_token_index"] for anchor in anchors], [0, 1, 2, 3])

    def test_repeated_chorus_remains_monotonic(self):
        plan = self.plan("We sing loud\nWe sing loud", "We sing loud noise We sing loud")
        self.assertEqual([anchor["time"] for anchor in plan["anchors"]], sorted(anchor["time"] for anchor in plan["anchors"]))
        self.assertEqual(plan["lines"], ["We sing loud", "We sing loud"])

    def test_live_only_section_absent_from_lyrics_does_not_displace_later_lines(self):
        plan = self.plan("Verse one\nVerse two", "Verse one thank you everybody Verse two")
        self.assertEqual([region["lines"] for region in plan["regions"]], [["Verse one"], ["Verse two"]])

    def test_lyric_line_absent_from_audio_is_preserved_for_approximate_fallback(self):
        plan = self.plan("Present line\nAbsent lyric", "Present line")
        self.assertEqual(plan["lines"], ["Present line", "Absent lyric"])
        self.assertEqual(plan["regions"][-1]["lines"], ["Absent lyric"])
        self.assertGreaterEqual(plan["regions"][-1]["end"], plan["regions"][-1]["start"])

    def test_approximate_fallback_distributes_lines_across_the_broad_region(self):
        timed = approximate_line_word_timings(["Short line", "A much longer lyric line"], 10.0, 20.0)
        self.assertEqual([[word["word"] for word in line] for line in timed], [["Short", "line"], ["A", "much", "longer", "lyric", "line"]])
        self.assertEqual(timed[0][0]["start"], 10.0)
        self.assertEqual(timed[-1][-1]["end"], 20.0)
        self.assertLessEqual(timed[0][-1]["end"], timed[1][0]["start"])

    def test_approximate_fallback_expands_a_zero_width_search_region(self):
        timed = approximate_line_word_timings(["Missing lyric"], 42.0, 42.0)
        self.assertGreaterEqual(timed[-1][-1]["end"] - timed[0][0]["start"], 1.5)

    def test_approximate_fallback_can_time_all_lines_without_asr_tokens(self):
        timed = approximate_line_word_timings(["First missing line", "Second missing line"], 0.0, 0.0)
        self.assertEqual(len(timed), 2)
        self.assertTrue(all(line for line in timed))
        self.assertLess(timed[0][0]["start"], timed[-1][-1]["end"])

    def test_generated_gaps_shorter_than_250ms_are_collapsed(self):
        words = [
            {"id": "one", "text": "One", "start": 1000, "end": 1200},
            {"id": "two", "text": "two", "start": 1449, "end": 1700},
        ]
        normalize_generated_word_gaps(words)
        self.assertEqual([word.get("type") for word in words], [None, None])
        self.assertEqual(words[1]["start"], 1200)

    def test_generated_gaps_of_250ms_or_more_remain_editable_gap_tokens(self):
        words = [
            {"id": "one", "text": "One", "start": 1000, "end": 1200},
            {"id": "two", "text": "two", "start": 1200 + MIN_GENERATED_GAP_MS, "end": 1700},
        ]
        normalize_generated_word_gaps(words)
        self.assertEqual(words[1]["type"], "gap")
        self.assertEqual(words[1]["end"] - words[1]["start"], MIN_GENERATED_GAP_MS)

    def test_adjacent_alignment_regions_never_overlap(self):
        lines, tokens = tokenize_lyrics("First\nSecond\nThird")
        asr = tokenize_asr(asr_words("First Second Third", start=10.0, step=1.0))
        anchors = [
            {"lyric_token_index": 0, "time": 10.0, "end": 12.0, "confidence": 1.0},
            {"lyric_token_index": 1, "time": 11.0, "end": 13.0, "confidence": 1.0},
            {"lyric_token_index": 2, "time": 14.0, "end": 15.0, "confidence": 1.0},
        ]
        regions = build_alignment_regions(lines, tokens, anchors, asr)
        self.assertTrue(all(regions[index]["end"] <= regions[index + 1]["start"] for index in range(len(regions) - 1)))

    def test_monotonic_timing_blocks_partition_crossing_lines(self):
        self.assertEqual(
            monotonic_timing_blocks([(43420, 45003), (43921, 44282), (44302, 44823), (44843, 45705), (51546, 53340), (46247, 46868), (55556, 58194), (47710, 48252), (60410, 62098), (49334, 50016), (54009, 56580)]),
            [(0, 4), (4, 6), (6, 8), (8, 11)],
        )

    def test_multiple_identical_lines_keep_distinct_source_indices(self):
        plan = self.plan("Again\nAgain\nAgain", "Again Again Again")
        self.assertEqual(plan["lines"], ["Again", "Again", "Again"])
        self.assertEqual([anchor["lyric_token_index"] for anchor in plan["anchors"]], [0, 1, 2])

    def test_first_chorus_fixture_builds_one_broad_region_between_anchors(self):
        lyrics = """The sun will shine for you
Change to something new
Spread your wings, break through
Like a butterfly"""
        plan = self.plan(lyrics, "The sun will shine for you Change to sun Like a butterfly")
        self.assertEqual(plan["lines"], lyrics.splitlines())
        self.assertEqual(plan["regions"][1]["lines"], ["Change to something new", "Spread your wings, break through", "Like a butterfly"])
        self.assertEqual(plan["regions"][1]["text"], "Change to something new Spread your wings, break through Like a butterfly")
        self.assertLess(plan["regions"][1]["start"], 10.0)
        self.assertLess(plan["regions"][1]["end"], 10.0)


if __name__ == "__main__":
    unittest.main()