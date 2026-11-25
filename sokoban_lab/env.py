"""Gymnasium environment with four binary observation planes."""

from operator import index

import gymnasium as gym
import numpy as np

from .core import Board, DIRECTIONS
from .levels import TRAIN


ACTIONS = tuple(DIRECTIONS)


class SokobanEnv(gym.Env):
    metadata = {'render_modes': ['ansi']}

    def __init__(self, levels=TRAIN, max_steps=100, shaped=True, render_mode=None):
        super().__init__()
        self.boards = tuple(map(Board.parse, levels))
        if not self.boards or len({(b.height, b.width) for b in self.boards}) != 1:
            raise ValueError('Levels must have a common shape')
        if index(max_steps) < 1:
            raise ValueError('max_steps must be positive')
        if render_mode not in (None, 'ansi'):
            raise ValueError('Only ANSI rendering is supported')

        first_board = self.boards[0]
        shape = (4, first_board.height, first_board.width)
        self.observation_space = gym.spaces.Box(0, 1, shape, dtype=np.float32)
        self.action_space = gym.spaces.Discrete(len(ACTIONS))
        self.max_steps = max_steps
        self.shaped = shaped
        self.render_mode = render_mode
        self.state = None

    def observation(self):
        if self.state is None:
            raise gym.error.ResetNeeded('Call reset() before observing the board')

        board = self.board
        planes = np.zeros(self.observation_space.shape, dtype=np.float32)
        planes[0] = 1
        for x, y in board.floor:
            planes[0, y, x] = 0
        for x, y in board.targets:
            planes[1, y, x] = 1
        for x, y in self.state.crates:
            planes[2, y, x] = 1
        x, y = self.state.player
        planes[3, y, x] = 1
        return planes

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        if options is not None and 'level' in options:
            level = index(options['level'])
            if not 0 <= level < len(self.boards):
                raise ValueError(f'level must be between 0 and {len(self.boards) - 1}')
        else:
            level = int(self.np_random.integers(len(self.boards)))

        self.board = self.boards[level]
        self.state = self.board.initial
        self.steps = 0
        return self.observation(), {'level': level, 'is_success': self.board.solved(self.state)}

    def step(self, action):
        if self.state is None:
            raise gym.error.ResetNeeded('Call reset() before taking a step')
        if not self.action_space.contains(action):
            raise ValueError(f'Invalid action {action!r}')

        before = self.state
        board = self.board
        self.steps += 1
        if board.solved(before):
            return self.observation(), 1.0, True, False, {'is_success': True}

        self.state = board.move(before, ACTIONS[int(action)])
        won = board.solved(self.state)
        reward = 1.0 if won else 0.0
        if self.shaped:
            target_gain = len(self.state.crates & board.targets) - len(before.crates & board.targets)
            reward += 0.1 * target_gain - 0.01
            if before == self.state:
                reward -= 0.02
        truncated = self.steps >= self.max_steps and not won
        return self.observation(), reward, won, truncated, {'is_success': won}

    def render(self):
        if self.state is None:
            raise gym.error.ResetNeeded('Call reset() before rendering the board')
        return self.board.render(self.state)
