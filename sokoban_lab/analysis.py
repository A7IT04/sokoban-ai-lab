"""Explain provable Sokoban deadlocks using board geometry and goal matching."""

from collections import deque
from dataclasses import dataclass

from .core import Board, Cell, Position


@dataclass(frozen=True)
class Deadlock:
    kind: str
    cells: tuple[Cell, ...] = ()


def _assign_goal(crate: Cell, reachability: list[dict[Cell, int]], assignments: dict[int, Cell]) -> bool:
    # Search an alternating path so earlier matches can be reassigned.
    queue = deque([crate])
    seen_crates = {crate}
    previous_goal: dict[Cell, int] = {}
    previous_crate: dict[int, Cell] = {}
    while queue:
        candidate = queue.popleft()
        for goal, reachable in enumerate(reachability):
            if goal in previous_crate or candidate not in reachable:
                continue
            previous_crate[goal] = candidate
            if goal not in assignments:
                while True:
                    crate_on_path = previous_crate[goal]
                    assignments[goal] = crate_on_path
                    if crate_on_path == crate:
                        return True
                    goal = previous_goal[crate_on_path]
            assigned = assignments[goal]
            if assigned not in seen_crates:
                seen_crates.add(assigned)
                previous_goal[assigned] = goal
                queue.append(assigned)
    return False


def _has_goal_matching(board: Board, crates: frozenset[Cell]) -> bool:
    reachability = [board.crate_push_distances([goal]) for goal in sorted(board.targets)]
    assignments: dict[int, Cell] = {}
    return all(_assign_goal(crate, reachability, assignments) for crate in sorted(crates))


def analyze(board: Board, state: Position | None = None) -> tuple[set[Cell], list[Deadlock]]:
    """Return static dead squares and any proven deadlocks in the position."""
    position = board.initial if state is None else state
    dead_squares = board.floor - board.viable_crate_cells()
    reasons = []
    static_crates = position.crates & dead_squares
    if static_crates:
        reasons.append(Deadlock('static', tuple(sorted(static_crates))))
    frozen = board.frozen_crates(position.crates)
    if frozen:
        reasons.append(Deadlock('frozen', tuple(sorted(frozen))))
    if not static_crates and not _has_goal_matching(board, position.crates):
        reasons.append(Deadlock('matching'))
    return set(dead_squares), reasons
