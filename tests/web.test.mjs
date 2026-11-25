import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {LEVELS} from '../docs/levels.mjs';
import {analyze, formatBoard, move, parseBoard, replay, solve, solved} from '../docs/solver.mjs';

const python = process.env.PYTHON ?? 'python';
const objectives = ({moves, pushes}) => [moves, pushes];

test('Both search objectives match Python on all gallery puzzles', () => {
  const process = spawnSync(python, ['-c', `
import json
import sys
from sokoban_lab.core import Board, solve
from sokoban_lab.hierarchical import plan
from sokoban_lab.levels import TRAIN, EVAL

answers = []
for level in json.load(sys.stdin):
    board = Board.parse(level)
    answers.append([])
    for solver in (solve, plan):
        result = solver(board)
        state = board.initial
        pushes = 0
        for action in result.actions:
            next_state = board.move(state, action)
            pushes += int(next_state.crates != state.crates)
            state = next_state
        answers[-1].append([result.status, len(result.actions), pushes])

print(json.dumps({'answers': answers, 'levels': TRAIN + EVAL}))
`], {input: JSON.stringify(LEVELS.map(item => item.xsb)), encoding: 'utf8'});
  assert.equal(process.status, 0, process.stderr);
  const {answers, levels} = JSON.parse(process.stdout);
  assert.deepEqual(LEVELS.slice(2).map(level => level.xsb), levels);

  for (const [index, level] of LEVELS.entries()) {
    const board = parseBoard(level.xsb);
    assert.equal(formatBoard(board, board.initial), level.xsb);
    for (const [plannerIndex, planner] of ['astar', 'macro'].entries()) {
      const result = solve(board, board.initial, planner);
      assert.deepEqual([result.status, ...objectives(result)], answers[index][plannerIndex]);
      assert(solved(board, replay(board, board.initial, result.actions).at(-1)));
    }
  }
});

test('Crossroads exposes a measurable tradeoff between the two objectives', () => {
  const board = parseBoard(LEVELS[0].xsb);
  assert.deepEqual(objectives(solve(board, board.initial, 'astar')), [18, 6]);
  assert.deepEqual(objectives(solve(board, board.initial, 'macro')), [19, 4]);
});

test('Deadlocks are distinguished from a search budget limit and a solved board', () => {
  const frozen = parseBoard('##########\n#    ....#\n#        #\n#  $$    #\n#  $$    #\n# @      #\n##########');
  assert.deepEqual(analyze(frozen, frozen.initial).reasons.map(reason => reason.kind), ['frozen']);
  assert.equal(solve(frozen, frozen.initial, 'astar', 0).status, 'unsolvable');

  const matching = parseBoard('#############\n#     #     #\n#   . #  .  #\n# @$$ #     #\n#     #     #\n#     #     #\n#############');
  assert.deepEqual(analyze(matching, matching.initial).reasons.map(reason => reason.kind), ['matching']);
  const playable = parseBoard(LEVELS[2].xsb);
  assert.equal(solve(playable, playable.initial, 'macro', 0).status, 'limit');
  const won = move(playable, playable.initial, 'R');
  assert.equal(solve(playable, won, 'astar', 0).status, 'solved');
  assert.deepEqual(analyze(playable, won).reasons, []);
});

test('Invalid input and blocked replay steps report clear errors', () => {
  assert.throws(() => parseBoard('###\n##'), /equal-width/);
  assert.throws(() => parseBoard('#####\n#@%.#\n#####'), /Unknown tile/);
  const board = parseBoard('#####\n#@$.#\n#####');
  assert.equal(move(board, board.initial, 'U'), board.initial);
  assert.throws(() => replay(board, board.initial, 'U'), /blocked move/);
});
