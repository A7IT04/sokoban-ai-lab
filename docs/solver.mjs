export const ACTIONS = Object.freeze(['U', 'D', 'L', 'R']);
export const SEARCH_BUDGET = 60_000;
const DELTAS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const OPPOSITE = [1, 0, 3, 2];
const MAX_SIZE = 24;
const MAX_CRATES = 12;

export function parseBoard(text) {
  const rows = text.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '').split('\n');
  const width = rows[0].length;
  const height = rows.length;
  if (!width || rows.some(row => row.length !== width)) {
    throw new Error('Use a rectangular grid with equal-width rows.');
  }
  if (width > MAX_SIZE || height > MAX_SIZE) {
    throw new Error('The browser lab supports boards up to 24 × 24 cells.');
  }

  const floor = new Uint8Array(width * height);
  const goals = new Set();
  const crates = [];
  const players = [];
  const neighbors = Array.from({length: floor.length}, () => [-1, -1, -1, -1]);
  rows.forEach((row, y) => [...row].forEach((tile, x) => {
    if (!'# .$@*+'.includes(tile)) throw new Error(`Unknown tile ${JSON.stringify(tile)}.`);
    if (tile === '#') return;
    const cell = y * width + x;
    floor[cell] = 1;
    if ('.*+'.includes(tile)) goals.add(cell);
    if ('$*'.includes(tile)) crates.push(cell);
    if ('@+'.includes(tile)) players.push(cell);
  }));

  if (players.length !== 1 || crates.length < 1 || crates.length !== goals.size) {
    throw new Error('Use one player and the same nonzero number of crates and goals.');
  }
  if (crates.length > MAX_CRATES) throw new Error('The browser lab supports up to 12 crates.');

  const cellAt = (x, y) => x >= 0 && x < width && y >= 0 && y < height ? y * width + x : -1;
  for (let cell = 0; cell < floor.length; cell += 1) {
    if (!floor[cell]) continue;
    const x = cell % width;
    const y = Math.floor(cell / width);
    DELTAS.forEach(([dx, dy], index) => {
      const next = cellAt(x + dx, y + dy);
      if (floor[next]) neighbors[cell][index] = next;
    });
  }

  const board = {width, height, floor, goals, neighbors, cellAt, initial: {player: players[0], crates}};
  board.goalDistances = [...goals].map(goal => reverseDistances(board, [goal]));
  board.distances = reverseDistances(board, goals);
  return board;
}

function reverseDistances(board, goals) {
  const queue = [...goals];
  const distances = new Int16Array(board.floor.length).fill(-1);
  for (const goal of goals) distances[goal] = 0;
  for (let i = 0; i < queue.length; i += 1) {
    const cell = queue[i];
    board.neighbors[cell].forEach((previous, direction) => {
      if (previous < 0 || board.neighbors[previous][direction] < 0 || distances[previous] >= 0) return;
      distances[previous] = distances[cell] + 1;
      queue.push(previous);
    });
  }
  return distances;
}

const sortCells = (a, b) => a - b;

export function move(board, state, action) {
  const direction = ACTIONS.indexOf(action);
  const next = board.neighbors[state.player][direction];
  if (next === undefined || next < 0) return state;
  if (!state.crates.includes(next)) return {player: next, crates: state.crates};
  const destination = board.neighbors[next][direction];
  if (destination < 0 || state.crates.includes(destination)) return state;
  const crates = state.crates.map(crate => crate === next ? destination : crate).sort(sortCells);
  return {player: next, crates};
}

export const solved = (board, state) => state.crates.every(crate => board.goals.has(crate));

export function formatBoard(board, state) {
  const rows = [];
  for (let y = 0; y < board.height; y += 1) {
    let row = '';
    for (let x = 0; x < board.width; x += 1) {
      const cell = y * board.width + x;
      const goal = board.goals.has(cell);
      if (cell === state.player) row += goal ? '+' : '@';
      else if (state.crates.includes(cell)) row += goal ? '*' : '$';
      else if (goal) row += '.';
      else row += board.floor[cell] ? ' ' : '#';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function frozenCrates(board, crates) {
  const blocked = new Set();
  for (const crate of crates) {
    if (board.goals.has(crate)) continue;
    const x = crate % board.width;
    const y = Math.floor(crate / board.width);
    for (const left of [x - 1, x]) {
      for (const top of [y - 1, y]) {
        const block = [
          board.cellAt(left, top), board.cellAt(left + 1, top),
          board.cellAt(left, top + 1), board.cellAt(left + 1, top + 1),
        ];
        if (block.every(cell => !board.floor[cell] || crates.includes(cell))) blocked.add(crate);
      }
    }
  }
  return [...blocked];
}

function hasGoalMatching(board, crates) {
  const assigned = new Map();
  function assign(crate, visited) {
    for (let i = 0; i < board.goalDistances.length; i += 1) {
      if (board.goalDistances[i][crate] < 0 || visited.has(i)) continue;
      visited.add(i);
      if (!assigned.has(i) || assign(assigned.get(i), visited)) {
        assigned.set(i, crate);
        return true;
      }
    }
    return false;
  }
  return crates.every(crate => assign(crate, new Set()));
}

export function analyze(board, state) {
  const deadSquares = [...board.floor.keys()].filter(cell => board.floor[cell] && board.distances[cell] < 0);
  const staticCrates = state.crates.filter(crate => board.distances[crate] < 0);
  const frozen = frozenCrates(board, state.crates);
  const reasons = [];
  if (staticCrates.length) reasons.push({kind: 'static', cells: staticCrates});
  if (frozen.length) reasons.push({kind: 'frozen', cells: frozen});
  if (!staticCrates.length && !hasGoalMatching(board, state.crates)) reasons.push({kind: 'matching', cells: []});
  return {deadSquares, reasons};
}

class MinHeap {
  items = [];

  static before(a, b) {
    return a.primary < b.primary || (a.primary === b.primary &&
      (a.secondary < b.secondary || (a.secondary === b.secondary && a.order < b.order)));
  }

  push(value) {
    const items = this.items;
    let index = items.length;
    items.push(value);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!MinHeap.before(value, items[parent])) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = value;
  }

  pop() {
    const items = this.items;
    const first = items[0];
    const last = items.pop();
    if (items.length === 0) return first;
    let index = 0;
    while (index * 2 + 1 < items.length) {
      let child = index * 2 + 1;
      if (child + 1 < items.length && MinHeap.before(items[child + 1], items[child])) child += 1;
      if (!MinHeap.before(items[child], last)) break;
      items[index] = items[child];
      index = child;
    }
    items[index] = last;
    return first;
  }
}

function* moveSuccessors(board, state) {
  for (const action of ACTIONS) {
    const next = move(board, state, action);
    if (next !== state) yield [next, action, next.crates === state.crates ? 0 : 1];
  }
}

function* pushSuccessors(board, state) {
  const routes = new Map([[state.player, '']]);
  const queue = [state.player];
  for (let i = 0; i < queue.length; i += 1) {
    const cell = queue[i];
    board.neighbors[cell].forEach((next, direction) => {
      if (next < 0 || routes.has(next) || state.crates.includes(next)) return;
      routes.set(next, routes.get(cell) + ACTIONS[direction]);
      queue.push(next);
    });
  }

  for (const crate of state.crates) {
    for (let direction = 0; direction < ACTIONS.length; direction += 1) {
      const stand = board.neighbors[crate][OPPOSITE[direction]];
      const destination = board.neighbors[crate][direction];
      if (!routes.has(stand) || destination < 0 || state.crates.includes(destination)) continue;
      const crates = state.crates.map(cell => cell === crate ? destination : cell).sort(sortCells);
      yield [{player: crate, crates}, routes.get(stand) + ACTIONS[direction], 1];
    }
  }
}

const stateKey = state => `${state.player}|${state.crates.join(',')}`;

export function solve(board, state = board.initial, planner = 'astar', limit = SEARCH_BUDGET) {
  if (planner !== 'astar' && planner !== 'macro') throw new Error('Unknown planner.');
  if (!Number.isInteger(limit) || limit < 0) throw new Error('Use a nonnegative search budget.');

  const startTime = performance.now();
  let expanded = 0;
  const report = (status, actions = '', pushes = 0) => ({
    planner, status, actions, moves: actions.length, pushes, expanded,
    milliseconds: Math.round((performance.now() - startTime) * 10) / 10,
  });
  if (analyze(board, state).reasons.length) return report('unsolvable');

  const isMacro = planner === 'macro';
  const successors = isMacro ? pushSuccessors : moveSuccessors;
  const heuristic = crates => crates.reduce((total, crate) => total + board.distances[crate], 0);
  const queue = new MinHeap();
  const best = new Map();
  let order = 0;
  function enqueue(next, parent, segment, moves, pushes) {
    const key = stateKey(next);
    const primary = isMacro ? pushes : moves + heuristic(next.crates);
    const node = {next, parent, segment, key, moves, pushes, primary, secondary: moves, order};
    order += 1;
    best.set(key, node);
    queue.push(node);
  }
  enqueue(state, null, '', 0, 0);

  while (queue.items.length) {
    const node = queue.pop();
    if (best.get(node.key) !== node) continue;
    if (solved(board, node.next)) {
      const segments = [];
      for (let step = node; step.parent; step = step.parent) segments.push(step.segment);
      return report('solved', segments.reverse().join(''), node.pushes);
    }
    if (expanded >= limit) return report('limit');
    expanded += 1;
    for (const [next, segment, pushed] of successors(board, node.next)) {
      const moves = node.moves + segment.length;
      const pushes = node.pushes + pushed;
      const previous = best.get(stateKey(next));
      if (previous && (isMacro && previous.pushes !== pushes ? previous.pushes < pushes : previous.moves <= moves)) continue;
      if (pushed && (next.crates.some(crate => board.distances[crate] < 0) || frozenCrates(board, next.crates).length)) continue;
      enqueue(next, node, segment, moves, pushes);
    }
  }
  return report('unsolvable');
}

export function replay(board, initial, actions) {
  const states = [initial];
  for (const action of actions) {
    const previous = states.at(-1);
    const next = move(board, previous, action);
    if (next === previous) throw new Error('The solution contains a blocked move.');
    states.push(next);
  }
  return states;
}
