import unittest
from sokoban_lab.core import Board,solve
from sokoban_lab.levels import TRAIN,EVAL
from sokoban_lab.hierarchical import plan

class CoreTests(unittest.TestCase):
    def test_all_levels(self):
        for level in TRAIN+EVAL:
            with self.subTest(level=level):
                b=Board.parse(level); result=solve(b); self.assertEqual(result.status,'solved'); s=b.initial
                for a in result.actions: s=b.move(s,a)
                self.assertTrue(b.solved(s))
    def test_macro_planner(self):
        for level in TRAIN+EVAL:
            b=Board.parse(level); result=plan(b); self.assertEqual(result.status,"solved"); s=b.initial
            for a in result.actions: s=b.move(s,a)
            self.assertTrue(b.solved(s))
    def test_push(self):
        b=Board.parse(TRAIN[0]); self.assertTrue(b.solved(b.move(b.initial,'R')))
    def test_wall(self):
        b=Board.parse(TRAIN[0]); s=b.initial
        for _ in range(10): s=b.move(s,'U')
        self.assertEqual(s.player[1],1)
    def test_bad_input(self):
        with self.assertRaises(ValueError): Board.parse('###\n#@#\n###')
    def test_deadlock(self):
        b=Board.parse('#####\n#$@ #\n# . #\n#####'); self.assertEqual(solve(b).status,'unsolvable')
    def test_limit(self):
        self.assertEqual(solve(Board.parse(TRAIN[0]),limit=0).status,'limit')
    def test_macro_hint_uses_current_position(self):
        board = Board.parse(TRAIN[0])
        current = board.move(board.initial, 'U')
        result = plan(board, initial=current)
        self.assertEqual(result.status, 'solved')
        for action in result.actions:
            current = board.move(current, action)
        self.assertTrue(board.solved(current))

    def test_reverse_push_distance_accounts_for_walls(self):
        board = Board.parse('#######\n#@$# .#\n#     #\n#     #\n#######')
        self.assertEqual(board.crate_push_distances()[(2, 2)], 4)
        self.assertNotIn((2, 1), board.viable_crate_cells())
        self.assertEqual(solve(board).expanded, 0)

    def test_render_roundtrip(self):
        b=Board.parse(TRAIN[0]); self.assertEqual(Board.parse(b.render(b.initial)),b)
if __name__=='__main__': unittest.main()
