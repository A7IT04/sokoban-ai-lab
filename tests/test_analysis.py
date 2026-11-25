"""Regression tests for deadlock diagnostics."""

import json
import subprocess
import sys
import unittest

from sokoban_lab.analysis import analyze
from sokoban_lab.core import Board, solve
from sokoban_lab.hierarchical import plan


class DiagnosticsTests(unittest.TestCase):
    def test_frozen_block_can_be_detected_on_otherwise_viable_cells(self):
        board = Board.parse(
            '##########\n#    ....#\n#        #\n#  $$    #\n#  $$    #\n# @      #\n##########'
        )
        dead_squares, reasons = analyze(board)
        self.assertFalse(dead_squares & board.initial.crates)
        self.assertEqual([reason.kind for reason in reasons], ['frozen'])
        self.assertEqual(set(reasons[0].cells), board.initial.crates)
        for solver in (solve, plan):
            self.assertEqual(solver(board).status, 'unsolvable')
            self.assertEqual(solver(board).expanded, 0)

    def test_goal_matching_detects_a_goal_in_a_disconnected_room(self):
        board = Board.parse(
            '#############\n#     #     #\n#   . #  .  #\n# @$$ #     #\n'
            '#     #     #\n#     #     #\n#############'
        )
        dead_squares, reasons = analyze(board)
        self.assertFalse(dead_squares & board.initial.crates)
        self.assertEqual([reason.kind for reason in reasons], ['matching'])

    def test_analysis_cli_returns_coordinates(self):
        output = subprocess.check_output(
            [sys.executable, '-m', 'sokoban_lab', 'analyze', '--split', 'eval', '--level', '0'],
            text=True,
        )
        report = json.loads(output)
        self.assertTrue(report['dead_squares'])
        self.assertEqual(report['deadlocks'], [])
