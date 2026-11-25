# Sokoban AI Lab

A Python lab for experimenting with shortest-move search, minimum-push planning, and reinforcement learning on Sokoban-style puzzles. The six included puzzles are small, hand-written examples intended for learning and debugging.

The project draws inspiration from [AI Sokoban Agent with RL](https://github.com/m7md-ebw/ai-sokoban), a graduation project at the Islamic University of Gaza. This repository contains an independent implementation and original levels. See the [Arabic guide](README.ar.md).

## Quick start

Use Python 3.10 or newer. The game and classical planners require no third-party runtime dependencies. Run these commands from the project directory.

```sh
python -m sokoban_lab play
python -m sokoban_lab solve --level 2
python -m sokoban_lab solve --planner macro --split eval --level 1
python -m sokoban_lab solve --file level.txt
python -m unittest discover -s tests -v
```

Use **U**, **D**, **L**, and **R** to move. Press **H** for a hint based on the current board and selected planner, or **Q** to quit. Built-in level indices start at zero. Custom levels use rectangular XSB text. Keep spaces inside each row and use one player and equal numbers of crates and goals.

| Symbol | Tile |
| --- | --- |
| `#` | Wall |
| Space | Floor |
| `@` | Player |
| `$` | Crate |
| `.` | Goal |
| `*` | Crate on a goal |
| `+` | Player on a goal |

After `python -m pip install .`, the same commands are available through `sokoban-lab`.

## Compare the planners

```sh
python -m sokoban_lab benchmark --planner astar
python -m sokoban_lab benchmark --planner macro
python -m sokoban_lab benchmark --planner astar --split eval
```

Each command emits one JSON record per puzzle. A* minimizes player moves, including pushes. It estimates the remaining work from reverse-push distances to the goals. The macro planner minimizes pushes by finding a walking route for each candidate push. Compare `moves` and `pushes` separately. The `expanded` count measures search states in each planner, and those states represent different steps. Use `--limit` to cap expansions.

## Run a reinforcement learning experiment

Install the optional dependencies with `python -m pip install '.[rl]'`. For a CPU-only Linux setup, install [the PyTorch CPU build](https://pytorch.org/get-started/locally/) in the same environment first. Training uses CPU and one PyTorch thread. The environment represents walls, goals, crates, and the player as four binary planes.

```sh
python -m sokoban_lab.train --algorithm ppo --steps 20000 --seed 42 --output runs/ppo
python -m sokoban_lab.train --algorithm rppo --steps 20000 --seed 42 --output runs/rppo
python -m sokoban_lab.train --algorithm dqn --steps 20000 --seed 42 --output runs/dqn
python -m sokoban_lab.train --algorithm ppo --curriculum --sparse --output runs/sparse
python -m tensorboard.main --logdir runs
```

The training command saves a model checkpoint, TensorBoard logs, and `evaluation.json`. Use `--load` with a trusted checkpoint from the matching algorithm to continue training. DQN starts a fresh replay buffer after loading. Reports distinguish requested, actual, and cumulative training steps. PPO-based runs can exceed the requested count to complete a rollout.

The curriculum expands the pool of four training puzzles in three stages. Evaluation resets the policy state on each of the two held-out puzzles and allows up to 100 moves per puzzle. Two puzzles give a quick check of the training pipeline. A broader evaluation requires more held-out layouts and multiple seeds.

## Validation and contributions

The automated tests cover search, game rules, and the Gymnasium environment. The CI workflow installs the package and runs short CPU training checks for PPO, Recurrent PPO, and DQN. No pretrained models are bundled.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit a level, reproducible experiment, or change. The project is released under the [MIT license](LICENSE).
