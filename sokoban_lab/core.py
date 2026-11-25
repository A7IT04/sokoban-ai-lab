"""Deterministic Sokoban rules and shortest-move A* search."""

from collections import deque
from collections.abc import Iterable
from dataclasses import dataclass
from heapq import heappop, heappush
from itertools import count
from typing import Optional


Cell = tuple[int, int]
DIRECTIONS = {'U': (0, -1), 'D': (0, 1), 'L': (-1, 0), 'R': (1, 0)}


def add(a: Cell, b: Cell) -> Cell:
    return a[0] + b[0], a[1] + b[1]


@dataclass(frozen=True)
class Position:
    player: Cell
    crates: frozenset[Cell]


@dataclass(frozen=True)
class Board:
    width: int
    height: int
    floor: frozenset[Cell]
    targets: frozenset[Cell]
    initial: Position

    @classmethod
    def parse(cls, text: str) -> 'Board':
        rows = text.strip('\n').splitlines()
        if not rows or any(len(row) != len(rows[0]) for row in rows):
            raise ValueError('Level must be rectangular')
        floor, targets, crates, players = set(), set(), set(), []
        for y, row in enumerate(rows):
            for x, char in enumerate(row):
                cell = (x, y)
                if char not in '# .$@*+':
                    raise ValueError(f'Unknown tile {char!r}')
                if char != '#':
                    floor.add(cell)
                if char in '.*+':
                    targets.add(cell)
                if char in '$*':
                    crates.add(cell)
                if char in '@+':
                    players.append(cell)

        if len(players) != 1 or not crates or len(crates) != len(targets):
            raise ValueError('Need one player and equal nonzero crate/target counts')
        return cls(
            len(rows[0]), len(rows), frozenset(floor), frozenset(targets),
            Position(players[0], frozenset(crates)),
        )

    def move(self, state: Position, action: str) -> Position:
        delta = DIRECTIONS[action.upper()]
        next_cell = add(state.player, delta)
        if next_cell not in self.floor:
            return state
        crates = state.crates
        if next_cell in crates:
            destination = add(next_cell, delta)
            if destination not in self.floor or destination in crates:
                return state
            crates = (crates - {next_cell}) | {destination}
        return Position(next_cell, crates)

    def solved(self, state: Position) -> bool:
        return state.crates == self.targets

    def render(self, state: Position) -> str:
        def tile(cell):
            if cell == state.player:
                return '+' if cell in self.targets else '@'
            if cell in state.crates:
                return '*' if cell in self.targets else '$'
            if cell in self.targets:
                return '.'
            return ' ' if cell in self.floor else '#'

        return '\n'.join(
            ''.join(tile((x, y)) for x in range(self.width))
            for y in range(self.height)
        )

    def crate_push_distances(self, goals: Optional[Iterable[Cell]] = None) -> dict[Cell, int]:
        """Minimum pushes to any goal with other crates and walking ignored."""
        distances = dict.fromkeys(self.targets if goals is None else goals, 0)
        queue = deque(distances)
        while queue:
            x, y = cell = queue.popleft()
            for dx, dy in DIRECTIONS.values():
                previous = (x - dx, y - dy)
                stand = (x - 2 * dx, y - 2 * dy)
                if previous in self.floor and stand in self.floor and previous not in distances:
                    distances[previous] = distances[cell] + 1
                    queue.append(previous)
        return distances

    def viable_crate_cells(self) -> set[Cell]:
        return set(self.crate_push_distances())

    def frozen_crates(self, crates: frozenset[Cell]) -> set[Cell]:
        """Find off-goal crates frozen in fully occupied 2-by-2 blocks."""
        blocked = set()
        for x, y in crates - self.targets:
            for left in (x - 1, x):
                for top in (y - 1, y):
                    block = ((left, top), (left + 1, top), (left, top + 1), (left + 1, top + 1))
                    if all(cell not in self.floor or cell in crates for cell in block):
                        blocked.add((x, y))
        return blocked


@dataclass(frozen=True)
class SearchResult:
    status: str
    actions: str
    expanded: int


def solve(board: Board, initial: Optional[Position] = None, limit: int = 100000) -> SearchResult:
    """Find a minimum-move solution within the expansion budget."""
    start = board.initial if initial is None else initial
    distances = board.crate_push_distances()
    if not start.crates <= distances.keys() or board.frozen_crates(start.crates):
        return SearchResult('unsolvable', '', 0)

    serial = count()
    heap = [(sum(distances[cell] for cell in start.crates), 0, next(serial), start)]
    best = {start: 0}
    parent = {}
    expanded = 0
    while heap:
        _, moves, _, state = heappop(heap)
        if best[state] != moves:
            continue
        if board.solved(state):
            actions = []
            while state in parent:
                state, action = parent[state]
                actions.append(action)
            return SearchResult('solved', ''.join(reversed(actions)), expanded)
        if expanded >= limit:
            return SearchResult('limit', '', expanded)

        expanded += 1
        next_moves = moves + 1
        for action in DIRECTIONS:
            successor = board.move(state, action)
            if successor == state or not successor.crates <= distances.keys():
                continue
            if next_moves >= best.get(successor, float('inf')):
                continue
            if successor.crates is not state.crates and board.frozen_crates(successor.crates):
                continue
            best[successor] = next_moves
            parent[successor] = (state, action)
            estimate = next_moves + sum(distances[cell] for cell in successor.crates)
            heappush(heap, (estimate, next_moves, next(serial), successor))
    return SearchResult('unsolvable', '', expanded)
