"""Classical planning at the crate-push and player-movement levels."""

from collections import deque
from heapq import heappop, heappush
from itertools import count
from typing import Optional

from .core import Board, DIRECTIONS, Position, SearchResult, add


def walking(board, state):
    paths = {state.player: ''}
    queue = deque([state.player])
    while queue:
        cell = queue.popleft()
        for action, delta in DIRECTIONS.items():
            target = add(cell, delta)
            if target in board.floor and target not in state.crates and target not in paths:
                paths[target] = paths[cell] + action
                queue.append(target)
    return paths


def plan(board: Board, limit: int = 100000, *, initial: Optional[Position] = None) -> SearchResult:
    """Minimize pushes, then moves among minimum-push solutions."""
    start = board.initial if initial is None else initial
    viable = board.viable_crate_cells()
    if not start.crates <= viable or board.frozen_crates(start.crates):
        return SearchResult('unsolvable', '', 0)

    order = count()
    queue = [(0, 0, next(order), start)]
    best = {start: (0, 0)}
    parent = {start: None}
    expanded = 0
    while queue:
        pushes, moves, _, state = heappop(queue)
        if best[state] != (pushes, moves):
            continue
        if board.solved(state):
            segments = []
            while parent[state] is not None:
                state, segment = parent[state]
                segments.append(segment)
            return SearchResult('solved', ''.join(reversed(segments)), expanded)
        if expanded >= limit:
            return SearchResult('limit', '', expanded)

        expanded += 1
        routes = walking(board, state)
        for crate in sorted(state.crates):
            for action, delta in DIRECTIONS.items():
                stand = (crate[0] - delta[0], crate[1] - delta[1])
                destination = add(crate, delta)
                if stand not in routes or destination not in viable or destination in state.crates:
                    continue
                segment = routes[stand] + action
                cost = (pushes + 1, moves + len(segment))
                successor = Position(crate, (state.crates - {crate}) | {destination})
                if successor in best and best[successor] <= cost:
                    continue
                if board.frozen_crates(successor.crates):
                    continue
                best[successor] = cost
                parent[successor] = (state, segment)
                heappush(queue, (*cost, next(order), successor))
    return SearchResult('unsolvable', '', expanded)
