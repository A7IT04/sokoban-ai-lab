"""Classical planning at the crate-push and player-movement levels."""

from collections import deque
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
    """Find a minimum-push solution within the expansion budget."""
    start = board.initial if initial is None else initial
    viable = board.viable_crate_cells()
    if not start.crates <= viable:
        return SearchResult('unsolvable', '', 0)

    queue = deque([start])
    parent = {start: None}
    expanded = 0
    while queue:
        state = queue.popleft()
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
                successor = Position(crate, (state.crates - {crate}) | {destination})
                if successor not in parent:
                    parent[successor] = (state, routes[stand] + action)
                    queue.append(successor)
    return SearchResult('unsolvable', '', expanded)
