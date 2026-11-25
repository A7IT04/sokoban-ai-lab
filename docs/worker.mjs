import {parseBoard, solve} from './solver.mjs';

self.addEventListener('message', ({data}) => {
  try {
    const board = parseBoard(data.level);
    const results = ['astar', 'macro'].map(planner => solve(board, board.initial, planner));
    self.postMessage({results});
  } catch (error) {
    self.postMessage({error: error.message});
  }
});
