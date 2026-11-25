import unittest
try:
    from sokoban_lab.env import SokobanEnv
    from gymnasium.utils.env_checker import check_env
except ImportError:
    SokobanEnv=None

@unittest.skipIf(SokobanEnv is None,'optional RL dependencies not installed')
class EnvTests(unittest.TestCase):
    def test_contract(self): check_env(SokobanEnv(),skip_render_check=True)
    def test_success(self):
        env=SokobanEnv(); env.reset(seed=1,options={'level':0}); _,_,won,cut,info=env.step(3); self.assertTrue(won); self.assertFalse(cut); self.assertTrue(info['is_success'])
    def test_timeout(self):
        env=SokobanEnv(max_steps=1); env.reset(options={'level':0}); _,_,won,cut,_=env.step(0); self.assertFalse(won); self.assertTrue(cut)
