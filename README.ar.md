# مختبر الذكاء الاصطناعي لسوكوبان

مشروع مفتوح المصدر لتجربة خوارزميات البحث والتعلم المعزز على ألغاز دفع الصناديق. تبحث خوارزمية `A*` عن أقل عدد من الحركات، ويبحث المخطط الهرمي عن أقل عدد من الدفعات ثم أقصر مسار عند التساوي.

## المختبر التفاعلي

العب من الجوال أو الكمبيوتر، واعرض أسباب انسداد الصناديق، وقارن الحلين من وضعك الحالي وشغّلهما خطوة بخطوة. يمكنك أيضًا تحميل ألغازك بصيغة XSB، ومشاركتها برابط، وتنزيل نتائج المقارنة بصيغة JSON. [افتح المختبر](https://sokoban-ai-lab-preview.surequince8.chatgpt.site/)

جرّب لغز **المفترق**. أقصر حل يحتاج إلى **18 حركة و6 دفعات**، فيما يحتاج حل أقل الدفعات إلى **19 حركة و4 دفعات**.

## التشغيل

استخدم Python 3.10 أو أحدث. يمكنك تشغيل المحرك والمحللين من مجلد المشروع مباشرة.

```sh
python -m sokoban_lab play
python -m sokoban_lab solve --level 2
python -m sokoban_lab solve --planner macro --split eval --level 1
python -m sokoban_lab benchmark --planner astar
python -m sokoban_lab benchmark --planner macro
python -m sokoban_lab analyze --file level.txt
python -m unittest discover -s tests -v
```

في اللعب استخدم `U/D/L/R` للحركة، و`H` لعرض تلميح من وضعك الحالي، و`Q` للخروج. يدعم خيار `--file` الألغاز المستطيلة بصيغة XSB. يسجل أمر المقارنة عدد الحركات والدفعات والحالات التي استكشفها كل محلل.

يعرض الأمر `analyze` إحداثيات الخانات المسدودة وأسباب الانسداد المؤكدة. لتشغيل الواجهة محليًا، استخدم `python -m http.server 8000 --directory docs` من مجلد المشروع. [افتح الواجهة المحلية](http://localhost:8000)

## التعلم المعزز

```sh
python -m pip install '.[rl]'
python -m sokoban_lab.train --algorithm ppo --steps 20000 --output runs/ppo
python -m sokoban_lab.train --algorithm rppo --steps 20000 --output runs/rppo
python -m sokoban_lab.train --algorithm dqn --steps 20000 --output runs/dqn
```

يتدرب النموذج على أربعة ألغاز ويُقيّم على لغزين منفصلين. يحفظ أمر التدريب النموذج وتقرير `evaluation.json` وسجلات TensorBoard. تكفي مجموعة الألغاز الصغيرة لفحص سير التجربة، ويحتاج تقييم التعميم إلى ألغاز أكثر وعدة بذور عشوائية.

المشروع مستقل ومستوحى من أسئلة مشروع [AI Sokoban](https://github.com/m7md-ebw/ai-sokoban). راجع [دليل التشغيل والمساهمة](README.md) و[ترخيص MIT](LICENSE).
