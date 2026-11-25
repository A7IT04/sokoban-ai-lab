import {LEVELS} from './levels.mjs';
import {SEARCH_BUDGET, analyze, formatBoard, move, parseBoard, replay, solved} from './solver.mjs';

const translations = {
  en: {
    title: 'Explore a puzzle.',
    intro: 'Push the crates onto their goals. Then compare the shortest route with the route that uses the fewest pushes.',
    board: 'Board', puzzle: 'Puzzle', crate: 'Crate', goal: 'Goal', deadSquare: 'Dead square',
    undo: 'Undo', reset: 'Reset', up: 'Up', down: 'Down', left: 'Left', right: 'Right',
    position: 'Position', showDead: 'Dead-square overlay', moves: 'Moves', pushes: 'Pushes', onGoals: 'On goals',
    solver: 'Compare solvers', compare: 'Run comparison', stop: 'Cancel',
    solverIntro: 'Both solvers start from your current position.',
    running: `Searching up to ${SEARCH_BUDGET.toLocaleString('en-US')} states per solver…`,
    cancelled: 'Comparison canceled.',
    ready: 'Select a solution to replay it on the board.',
    noReplay: 'Neither solver found a solution within the search budget.',
    failed: 'The comparison could not run.', limit: 'Search limit reached', unsolvable: 'No solution',
    astar: 'Fewest moves', macro: 'Fewest pushes', watch: 'Replay solution',
    exitReplay: 'Exit replay', timeline: 'Replay timeline', previous: 'Previous', next: 'Next',
    play: 'Play', pause: 'Pause', download: 'Download results (JSON)',
    solved: 'Solved. Every crate is on a goal.',
    deadlock: 'This position is a proven deadlock.',
    static: 'At least one crate is on a square that cannot reach any goal.',
    frozen: 'Crates and walls fill a 2 × 2 block, trapping a crate off its goal.',
    matching: 'The crates cannot each be assigned a different reachable goal.',
    clear: count => `No deadlock detected · ${count} static dead squares`,
    metrics: (moves, pushes) => `${moves} moves · ${pushes} pushes`,
    work: (states, milliseconds) => `${states} states expanded · ${milliseconds} ms`,
    boardSummary: (width, height, x, y) => `${width} by ${height} board. Player at column ${x}, row ${y}.`,
    editor: 'Edit or share a puzzle', editorLabel: 'Level in XSB format', custom: 'Custom puzzle',
    editorIntro: 'Keep the rows the same width. Spaces are floor. Use one player and matching counts of crates and goals.',
    wall: 'Wall', player: 'Player', crateGoal: 'Crate on goal', playerGoal: 'Player on goal',
    load: 'Load puzzle', share: 'Copy current puzzle link', shareLink: 'Puzzle link',
    loaded: 'Puzzle loaded.', invalid: 'Check that the text describes a valid Sokoban puzzle.',
    invalidLink: 'This link contains an invalid puzzle.', copied: 'Puzzle link copied.',
    copyFallback: 'Select and copy the link below.',
    moveGroup: 'Move player',
  },
  ar: {
    title: 'استكشف اللغز خطوة بخطوة.',
    intro: 'ادفع الصناديق إلى أهدافها، وقارن بين أقصر مسار والمسار الذي يتطلب أقل عدد من الدفعات.',
    board: 'اللوحة', puzzle: 'اللغز', crate: 'صندوق', goal: 'هدف', deadSquare: 'خانة مسدودة',
    undo: 'تراجع', reset: 'إعادة', up: 'أعلى', down: 'أسفل', left: 'يسار', right: 'يمين',
    position: 'حالة اللغز', showDead: 'إظهار الخانات المسدودة', moves: 'الحركات', pushes: 'الدفعات', onGoals: 'على الأهداف',
    solver: 'قارن الحلول', compare: 'ابدأ المقارنة', stop: 'إلغاء',
    solverIntro: 'يبدأ المحللان من وضعك الحالي.',
    running: `يجري البحث في ${SEARCH_BUDGET.toLocaleString('ar')} حالة كحد أقصى لكل محلل…`,
    cancelled: 'أُلغيت المقارنة.',
    ready: 'اختر حلًا لعرض خطواته على اللوحة.',
    noReplay: 'لم يجد أيّ من المحللين حلًا ضمن حد البحث.',
    failed: 'تعذّر تشغيل المقارنة.', limit: 'تم بلوغ حد البحث', unsolvable: 'لا يوجد حل',
    astar: 'أقل حركات', macro: 'أقل دفعات', watch: 'اعرض الحل',
    exitReplay: 'خروج من العرض', timeline: 'تسلسل خطوات الحل', previous: 'السابق', next: 'التالي',
    play: 'تشغيل', pause: 'إيقاف مؤقت', download: 'تنزيل نتائج المقارنة (JSON)',
    solved: 'تم الحل. كل صندوق على هدف.',
    deadlock: 'ثبت أن هذا الوضع مسدود.',
    static: 'يوجد صندوق في خانة لا يمكنه الوصول منها إلى أي هدف.',
    frozen: 'صناديق وجدران تملأ مربعًا من أربع خانات وتحاصر صندوقًا خارج هدفه.',
    matching: 'لا يمكن تخصيص هدف مختلف وقابل للوصول لكل صندوق.',
    clear: count => `لم تُكتشف حالة انسداد · ${count} خانة مسدودة بسبب الجدران`,
    metrics: (moves, pushes) => `${moves} حركة · ${pushes} دفعة`,
    work: (states, milliseconds) => `${states} حالة مستكشفة · ${milliseconds} مللي ثانية`,
    boardSummary: (width, height, x, y) => `لوحة ${width} في ${height}. اللاعب في العمود ${x} والصف ${y}.`,
    editor: 'حرّر لغزًا أو شاركه', editorLabel: 'اللغز بصيغة XSB', custom: 'لغز مخصّص',
    editorIntro: 'اكتب صفوفًا متساوية العرض. المسافة تمثّل الأرضية. استخدم لاعبًا واحدًا وعددًا متساويًا من الصناديق والأهداف.',
    wall: 'جدار', player: 'لاعب', crateGoal: 'صندوق على هدف', playerGoal: 'لاعب على هدف',
    load: 'تحميل اللغز', share: 'انسخ رابط اللغز الحالي', shareLink: 'رابط اللغز',
    loaded: 'تم تحميل اللغز.', invalid: 'تأكد أن النص يمثّل لغز سوكوبان صالحًا.',
    invalidLink: 'الرابط يحتوي على لغز غير صالح.', copied: 'تم نسخ رابط اللغز.',
    copyFallback: 'حدّد الرابط أدناه وانسخه.',
    moveGroup: 'تحريك اللاعب',
  },
};

const el = id => document.getElementById(id);
const moveButtons = [...document.querySelectorAll('[data-move]')];
const keyActions = {ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R'};
let language = navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
let board;
let levelId = LEVELS[0].id;
let positions = [];
let worker = null;
let results = [];
let comparisonStart;
let solverStatus = 'solverIntro';
let editorStatus = null;
let preview = null;
let timer = null;

function strings() {
  return translations[language];
}

function showSolverStatus(key) {
  solverStatus = key;
  el('solver-status').textContent = strings()[key];
}

function showEditorStatus(key = null, warning = false, detail = '') {
  editorStatus = {key, warning, detail};
  const status = el('editor-status');
  status.dataset.tone = warning ? 'warn' : '';
  status.textContent = key ? (language === 'en' && detail ? detail : strings()[key]) : '';
}

function renderBoard() {
  const current = preview ? preview.frames[preview.index] : positions.at(-1);
  const state = current.state;
  const completed = solved(board, state);
  const reached = state.crates.filter(crate => board.goals.has(crate)).length;
  const diagnosis = analyze(board, state);
  const dead = new Set(diagnosis.deadSquares);
  const trapped = new Set(diagnosis.reasons.flatMap(reason => reason.cells));
  const overlay = el('show-dead').checked;
  const grid = el('board');
  const cells = document.createDocumentFragment();
  grid.style.setProperty('--columns', board.width);
  const x = state.player % board.width + 1;
  const y = Math.floor(state.player / board.width) + 1;
  grid.setAttribute('aria-label', strings().boardSummary(board.width, board.height, x, y));
  for (let index = 0; index < board.floor.length; index += 1) {
    const tile = document.createElement('span');
    tile.className = 'tile';
    tile.setAttribute('aria-hidden', 'true');
    if (!board.floor[index]) tile.classList.add('wall');
    if (overlay && dead.has(index)) tile.classList.add('dead');
    if (trapped.has(index)) tile.classList.add('deadlock');
    const goal = board.goals.has(index);
    let tokenClass = goal ? 'goal' : '';
    if (state.crates.includes(index)) tokenClass = goal ? 'crate on-goal' : 'crate';
    else if (index === state.player) tokenClass = goal ? 'player on-goal' : 'player';
    if (tokenClass) {
      const token = document.createElement('i');
      token.className = tokenClass;
      tile.append(token);
    }
    cells.append(tile);
  }
  grid.replaceChildren(cells);
  el('move-count').textContent = preview ? preview.index : positions.length - 1;
  el('push-count').textContent = current.pushes;
  el('goal-count').textContent = `${reached} / ${state.crates.length}`;
  const status = el('position-status');
  status.dataset.tone = completed ? 'success' : diagnosis.reasons.length ? 'warn' : '';
  const heading = document.createElement('strong');
  heading.textContent = completed ? strings().solved : diagnosis.reasons.length ?
    strings().deadlock : strings().clear(dead.size);
  status.replaceChildren(heading);
  if (diagnosis.reasons.length) {
    const list = document.createElement('ul');
    for (const reason of diagnosis.reasons) {
      const item = document.createElement('li');
      item.textContent = strings()[reason.kind];
      list.append(item);
    }
    status.append(list);
  }
  for (const button of moveButtons) button.disabled = Boolean(preview) || completed;
  el('undo').disabled = Boolean(preview) || positions.length < 2;
  el('compare').disabled = Boolean(worker) || Boolean(preview);
}

function pauseReplay() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}

function renderReplay() {
  el('replay').hidden = !preview;
  if (!preview) return;
  const last = preview.frames.length - 1;
  el('replay-name').textContent = strings()[preview.planner];
  el('timeline').max = last;
  el('timeline').value = preview.index;
  el('replay-step').textContent = `${preview.index} / ${last}`;
  el('previous-step').disabled = preview.index === 0;
  el('next-step').disabled = preview.index === last;
  el('autoplay').disabled = last === 0;
  el('autoplay').textContent = timer === null ? strings().play : strings().pause;
}

function renderResults() {
  const container = el('results');
  container.hidden = results.length === 0;
  el('download').hidden = container.hidden;
  container.replaceChildren();
  for (const result of results) {
    const card = document.createElement('article');
    card.className = 'result-card';
    card.classList.toggle('selected', preview?.planner === result.planner);
    const name = document.createElement('h3');
    name.textContent = strings()[result.planner];
    const score = document.createElement('p');
    score.className = 'result-line';
    score.textContent = result.status === 'solved' ?
      strings().metrics(result.moves, result.pushes) : strings()[result.status];
    const work = document.createElement('p');
    work.className = 'muted';
    work.textContent = strings().work(result.expanded, result.milliseconds);
    card.append(name, score, work);
    if (result.status === 'solved') {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = strings().watch;
      button.setAttribute('aria-label', `${strings().watch} · ${strings()[result.planner]}`);
      button.setAttribute('aria-pressed', String(preview?.planner === result.planner));
      button.addEventListener('click', () => openReplay(result));
      card.append(button);
    }
    container.append(card);
  }
}

function stopWorker() {
  if (worker) worker.terminate();
  worker = null;
  el('stop').hidden = true;
}

function invalidateComparison() {
  stopWorker();
  pauseReplay();
  results = [];
  preview = null;
  comparisonStart = null;
  showSolverStatus('solverIntro');
  renderResults();
  renderReplay();
}

function loadPuzzle(text, id) {
  const next = parseBoard(text);
  invalidateComparison();
  board = next;
  levelId = id;
  positions = [{state: board.initial, pushes: 0}];
  el('level-input').value = formatBoard(board, board.initial);
  el('share-link').hidden = true;
  renderLevelSelect();
  renderBoard();
}

function renderLevelSelect() {
  const select = el('level-select');
  const options = LEVELS.map(level => new Option(level[language], level.id));
  if (levelId === 'custom') options.unshift(new Option(strings().custom, 'custom'));
  select.replaceChildren(...options);
  select.value = levelId;
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  el('language').textContent = language === 'ar' ? 'English' : 'العربية';
  el('move-pad').setAttribute('aria-label', strings().moveGroup);
  document.querySelectorAll('[data-i18n]').forEach(item => {
    item.textContent = strings()[item.dataset.i18n];
  });
  document.querySelectorAll('[data-label]').forEach(item => {
    item.setAttribute('aria-label', strings()[item.dataset.label]);
  });
  showSolverStatus(solverStatus);
  if (editorStatus) showEditorStatus(editorStatus.key, editorStatus.warning, editorStatus.detail);
  renderLevelSelect();
  renderBoard();
  renderResults();
  renderReplay();
}

function tryMove(action) {
  if (preview) return;
  const current = positions.at(-1);
  if (solved(board, current.state)) return;
  const next = move(board, current.state, action);
  if (next === current.state) return;
  invalidateComparison();
  positions.push({state: next, pushes: current.pushes + Number(next.crates !== current.state.crates)});
  renderBoard();
}

function runComparison() {
  if (worker || preview) return;
  invalidateComparison();
  comparisonStart = positions.at(-1).state;
  try {
    worker = new Worker(new URL('./worker.mjs', import.meta.url), {type: 'module'});
    const activeWorker = worker;
    worker.addEventListener('message', ({data}) => {
      if (activeWorker !== worker) return;
      stopWorker();
      if (data.error) {
        showSolverStatus('failed');
      } else {
        results = data.results;
        showSolverStatus(results.some(item => item.status === 'solved') ? 'ready' : 'noReplay');
      }
      renderResults();
      renderBoard();
    });
    worker.addEventListener('error', () => {
      if (activeWorker !== worker) return;
      stopWorker();
      showSolverStatus('failed');
      renderBoard();
    });
    worker.postMessage({level: formatBoard(board, comparisonStart)});
    el('stop').hidden = false;
    showSolverStatus('running');
    renderBoard();
  } catch {
    stopWorker();
    showSolverStatus('failed');
    renderBoard();
  }
}

function openReplay(result) {
  pauseReplay();
  const states = replay(board, comparisonStart, result.actions);
  let pushes = 0;
  const frames = states.map((state, index) => {
    if (index > 0 && state.crates !== states[index - 1].crates) pushes += 1;
    return {state, pushes};
  });
  preview = {planner: result.planner, frames, index: 0};
  renderResults();
  renderReplay();
  renderBoard();
  el('timeline').focus();
}

function setReplayIndex(index, manual) {
  if (manual) pauseReplay();
  const last = preview.frames.length - 1;
  preview.index = Math.max(0, Math.min(index, last));
  if (preview.index === last) pauseReplay();
  renderReplay();
  renderBoard();
}

function startAutoplay() {
  if (timer !== null) {
    pauseReplay();
    renderReplay();
    return;
  }
  if (preview.index === preview.frames.length - 1) setReplayIndex(0, true);
  timer = setInterval(() => setReplayIndex(preview.index + 1, false), 240);
  renderReplay();
}

function clearSharedHash() {
  if (location.hash) window.history.replaceState(null, '', location.pathname + location.search);
}

function loadSharedPuzzle() {
  const text = new URLSearchParams(location.hash.slice(1)).get('level');
  if (text === null) return;
  try {
    loadPuzzle(text, 'custom');
    showEditorStatus('loaded');
  } catch {
    el('editor').open = true;
    showEditorStatus('invalidLink', true);
  }
}

el('language').addEventListener('click', () => {
  language = language === 'en' ? 'ar' : 'en';
  applyLanguage();
});
el('show-dead').addEventListener('change', renderBoard);
el('level-select').addEventListener('change', event => {
  const selected = LEVELS.find(level => level.id === event.target.value);
  if (selected) {
    loadPuzzle(selected.xsb, selected.id);
    clearSharedHash();
    showEditorStatus();
  }
});
for (const button of moveButtons) button.addEventListener('click', () => tryMove(button.dataset.move));
document.addEventListener('keydown', event => {
  if (!keyActions[event.key] || preview || event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  tryMove(keyActions[event.key]);
});
el('undo').addEventListener('click', () => {
  if (positions.length < 2) return;
  invalidateComparison();
  positions.pop();
  renderBoard();
});
el('reset').addEventListener('click', () => {
  invalidateComparison();
  positions = [{state: board.initial, pushes: 0}];
  renderBoard();
});
el('compare').addEventListener('click', runComparison);
el('stop').addEventListener('click', () => {
  invalidateComparison();
  showSolverStatus('cancelled');
  renderBoard();
});
el('exit-replay').addEventListener('click', () => {
  pauseReplay();
  preview = null;
  renderResults();
  renderReplay();
  renderBoard();
  el('compare').focus();
});
el('timeline').addEventListener('input', event => setReplayIndex(Number(event.target.value), true));
el('previous-step').addEventListener('click', () => setReplayIndex(preview.index - 1, true));
el('next-step').addEventListener('click', () => setReplayIndex(preview.index + 1, true));
el('autoplay').addEventListener('click', startAutoplay);
el('download').addEventListener('click', () => {
  const report = {
    schema_version: 1,
    position_xsb: formatBoard(board, comparisonStart),
    expansion_budget: SEARCH_BUDGET,
    results,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sokoban-comparison.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
el('load-level').addEventListener('click', () => {
  try {
    loadPuzzle(el('level-input').value, 'custom');
    clearSharedHash();
    showEditorStatus('loaded');
  } catch (error) {
    showEditorStatus('invalid', true, error.message);
  }
});
el('copy-link').addEventListener('click', async () => {
  const shared = new URL(location.href);
  const xsb = formatBoard(board, board.initial);
  shared.hash = new URLSearchParams({level: xsb}).toString();
  try {
    await navigator.clipboard.writeText(shared.href);
    showEditorStatus('copied');
  } catch {
    el('share-link').value = shared.href;
    el('share-link').hidden = false;
    el('share-link').select();
    showEditorStatus('copyFallback');
  }
});
window.addEventListener('hashchange', loadSharedPuzzle);

loadPuzzle(LEVELS[0].xsb, LEVELS[0].id);
loadSharedPuzzle();
applyLanguage();
