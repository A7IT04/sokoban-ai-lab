# مختبر الذكاء الاصطناعي لسوكوبان

مشروع Python مفتوح المصدر لتجربة خوارزميات البحث والتعلم المعزز على ألغاز دفع الصناديق. يضم ستة ألغاز أصلية صغيرة ومحركًا للعب من الطرفية. يبحث **A*** عن أقل عدد من الحركات، ويبحث المخطط الهرمي التقليدي عن أقل عدد من الدفعات.

## التشغيل

استخدم Python 3.10 أو أحدث. يمكنك تشغيل المحرك والمحللين من مجلد المشروع مباشرة.

```sh
python -m sokoban_lab play
python -m sokoban_lab solve --level 2
python -m sokoban_lab solve --planner macro --split eval --level 1
python -m sokoban_lab benchmark --planner astar
python -m sokoban_lab benchmark --planner macro
python -m unittest discover -s tests -v
```

في اللعب استخدم `U/D/L/R` للحركة، و`H` لعرض تلميح من وضعك الحالي، و`Q` للخروج. يدعم خيار `--file` الألغاز المستطيلة بصيغة XSB. يسجل أمر المقارنة عدد الحركات والدفعات والحالات التي استكشفها كل محلل.

## التعلم المعزز

```sh
python -m pip install '.[rl]'
python -m sokoban_lab.train --algorithm ppo --steps 20000 --output runs/ppo
python -m sokoban_lab.train --algorithm rppo --steps 20000 --output runs/rppo
python -m sokoban_lab.train --algorithm dqn --steps 20000 --output runs/dqn
```

يتدرب النموذج على أربعة ألغاز ويُقيّم على لغزين منفصلين. يحفظ أمر التدريب النموذج وتقرير `evaluation.json` وسجلات TensorBoard. تكفي مجموعة الألغاز الصغيرة لفحص سير التجربة، ويحتاج تقييم التعميم إلى ألغاز أكثر وعدة بذور عشوائية.

المشروع مستقل ومستوحى من أسئلة مشروع [AI Sokoban](https://github.com/m7md-ebw/ai-sokoban). راجع [دليل التشغيل والمساهمة](README.md) و[ترخيص MIT](LICENSE).
