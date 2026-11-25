"""Command-line interface for playing and comparing the classical solvers."""

import argparse
from dataclasses import asdict
import json
import time
from pathlib import Path

from .analysis import analyze
from .core import Board, DIRECTIONS, solve
from .hierarchical import plan
from .levels import EVAL, TRAIN


def main():
    parser = argparse.ArgumentParser(description='Solve, play, diagnose or benchmark Sokoban')
    parser.add_argument('command', choices=['solve', 'play', 'analyze', 'benchmark'])
    parser.add_argument('--file', type=Path, help='UTF-8 level in rectangular XSB format')
    parser.add_argument('--split', choices=['train', 'eval'], help='Built-in level set')
    parser.add_argument('--level', type=int, help='Zero-based index in the selected level set')
    parser.add_argument('--limit', type=int, default=100000, help='Maximum search expansions')
    parser.add_argument('--planner', choices=['astar', 'macro'], default='astar')
    args = parser.parse_args()

    if args.limit < 0:
        parser.error('--limit must be nonnegative')
    if args.file and (args.split is not None or args.level is not None):
        parser.error('--file cannot be combined with --split or --level')

    planner = solve if args.planner == 'astar' else plan
    groups = {'train': TRAIN, 'eval': EVAL}
    try:
        if args.file:
            boards = [('file', 0, Board.parse(args.file.read_text(encoding='utf-8-sig')))]
        elif args.command == 'benchmark' and args.split is None and args.level is None:
            boards = [
                (name, index, Board.parse(level))
                for name, levels in groups.items()
                for index, level in enumerate(levels)
            ]
        else:
            split = args.split or 'train'
            levels = groups[split]
            if args.command == 'benchmark' and args.level is None:
                boards = [(split, index, Board.parse(level)) for index, level in enumerate(levels)]
            else:
                index = 0 if args.level is None else args.level
                if not 0 <= index < len(levels):
                    parser.error(f'--level must be between 0 and {len(levels) - 1} for {split}')
                boards = [(split, index, Board.parse(levels[index]))]
    except (OSError, ValueError) as error:
        parser.error(str(error))

    if args.command == 'benchmark':
        for split, index, board in boards:
            begin = time.perf_counter()
            result = planner(board, limit=args.limit)
            seconds = time.perf_counter() - begin
            state = board.initial
            pushes = 0
            for action in result.actions:
                successor = board.move(state, action)
                pushes += successor.crates != state.crates
                state = successor
            print(json.dumps({
                'split': split, 'level': index, 'planner': args.planner, 'status': result.status,
                'moves': len(result.actions), 'pushes': pushes, 'expanded': result.expanded,
                'seconds': round(seconds, 6),
            }))
        return

    board = boards[0][2]
    state = board.initial
    if args.command == 'analyze':
        dead_squares, deadlocks = analyze(board, state)
        print(json.dumps({
            'dead_squares': sorted(dead_squares),
            'deadlocks': [asdict(deadlock) for deadlock in deadlocks],
        }, indent=2))
        return

    if args.command == 'solve':
        print(board.render(state))
        print(planner(board, limit=args.limit))
        return

    while not board.solved(state):
        print(board.render(state))
        try:
            action = input('U/D/L/R, H hint, Q quit: ').strip().upper()
        except EOFError:
            return
        if action == 'Q':
            return
        if action == 'H':
            print(planner(board, initial=state, limit=args.limit))
        elif action in DIRECTIONS:
            state = board.move(state, action)
    print(board.render(state))
    print('Solved!')


if __name__ == '__main__':
    main()
