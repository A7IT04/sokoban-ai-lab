"""Train PPO, Recurrent PPO or DQN and evaluate on two held-out levels."""

import argparse
import json
from pathlib import Path

from .levels import EVAL, TRAIN


def evaluate(model, env, seed):
    import numpy as np

    results = []
    for level in range(len(env.boards)):
        observation, info = env.reset(seed=seed, options={'level': level})
        hidden_state = None
        episode_start = np.ones(1, dtype=bool)
        finished = info['is_success']
        while not finished:
            action, hidden_state = model.predict(
                observation, state=hidden_state, episode_start=episode_start, deterministic=True,
            )
            observation, _, terminated, truncated, info = env.step(action.item())
            finished = terminated or truncated
            episode_start.fill(False)
        results.append({'level': level, 'success': info['is_success'], 'steps': env.steps})
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--algorithm', choices=['ppo', 'rppo', 'dqn'], default='ppo')
    parser.add_argument('--steps', type=int, default=20000)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output', type=Path, default=Path('runs'))
    parser.add_argument('--sparse', action='store_true')
    parser.add_argument('--curriculum', action='store_true')
    parser.add_argument('--load', type=Path)
    args = parser.parse_args()

    stages = (TRAIN[:2], TRAIN[:3], TRAIN) if args.curriculum else (TRAIN,)
    if args.steps < len(stages):
        parser.error(f'--steps must be at least {len(stages)} for the selected training mode')

    try:
        import torch
        from sb3_contrib import RecurrentPPO
        from stable_baselines3 import DQN, PPO
        from stable_baselines3.common.monitor import Monitor
        from .env import SokobanEnv
    except ModuleNotFoundError as error:
        parser.error(f"optional RL package missing ({error.name}). Install with: pip install '.[rl]'")

    torch.set_num_threads(1)
    algorithms = {
        'ppo': (PPO, 'MlpPolicy', {'n_steps': 128, 'batch_size': 64}),
        'rppo': (RecurrentPPO, 'MlpLstmPolicy', {'n_steps': 128, 'batch_size': 64}),
        'dqn': (DQN, 'MlpPolicy', {
            'learning_starts': 1000, 'buffer_size': 50000, 'target_update_interval': 1000,
        }),
    }
    model_class, policy, settings = algorithms[args.algorithm]
    args.output.mkdir(parents=True, exist_ok=True)
    tensorboard_log = str(args.output / 'tensorboard')
    env = Monitor(SokobanEnv(stages[0], shaped=not args.sparse))
    try:
        if args.load:
            model = model_class.load(
                str(args.load), env=env, seed=args.seed, device='cpu', tensorboard_log=tensorboard_log,
            )
        else:
            model = model_class(
                policy, env, seed=args.seed, verbose=1, device='cpu',
                tensorboard_log=tensorboard_log, **settings,
            )

        initial_timesteps = model.num_timesteps
        steps_per_stage, remainder = divmod(args.steps, len(stages))
        for stage_index, levels in enumerate(stages):
            if stage_index:
                env.close()
                env = Monitor(SokobanEnv(levels, shaped=not args.sparse))
                model.set_env(env)
            env_steps = steps_per_stage + int(stage_index < remainder)
            model.learn(
                total_timesteps=env_steps,
                reset_num_timesteps=stage_index == 0 and args.load is None,
            )
        model.save(str(args.output / args.algorithm))
    finally:
        env.close()

    test_env = SokobanEnv(EVAL, shaped=False)
    try:
        results = evaluate(model, test_env, args.seed)
    finally:
        test_env.close()

    report = {
        'algorithm': args.algorithm,
        'seed': args.seed,
        'requested_timesteps': args.steps,
        'run_timesteps': model.num_timesteps - initial_timesteps,
        'training_timesteps': model.num_timesteps,
        'curriculum': args.curriculum,
        'shaped_rewards': not args.sparse,
        'success_rate': sum(result['success'] for result in results) / len(results),
        'episodes': results,
    }
    serialized = json.dumps(report, indent=2)
    (args.output / 'evaluation.json').write_text(serialized + '\n', encoding='utf-8')
    print(serialized)


if __name__ == '__main__':
    main()
