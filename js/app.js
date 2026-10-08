/* ============================================================
   LIFE DASHBOARD — app.js
   Challenges: Light/Dark Mode · Custom Name · Change Pomodoro Time
   ============================================================ */

'use strict';

/* ── Storage Keys ─────────────────────────────────────────── */
const KEYS = {
  THEME: 'ld_theme',
  NAME:  'ld_name',
  TODOS: 'ld_todos',
  LINKS: 'ld_links',
};

/* ──────────────────────────────────────────────────────────── */
/*  UTILITIES                                                   */
/* ──────────────────────────────────────────────────────────── */

/** Read from localStorage, parse JSON, return fallback on error */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Persist value to localStorage as JSON */
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Pad a number to two digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Generate a simple unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ──────────────────────────────────────────────────────────── */
/*  CLOCK & GREETING                                            */
/* ──────────────────────────────────────────────────────────── */

const clockEl      = document.getElementById('clock');
const dateEl       = document.getElementById('date-display');
const greetingEl   = document.getElementById('greeting-text');
const editNameBtn  = document.getElementById('edit-name-btn');

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now   = new Date();
  const h     = now.getHours();
  const m     = now.getMinutes();
  const s     = now.getSeconds();
  const ampm  = h >= 12 ? 'PM' : 'AM';
  const h12   = h % 12 || 12;

  clockEl.textContent = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;

  dateEl.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const name     = load(KEYS.NAME, '');
  const greeting = getGreeting(h);
  greetingEl.textContent = name ? `${greeting}, ${name} 👋` : `${greeting} 👋`;
}

setInterval(updateClock, 1000);
updateClock();

/* ──────────────────────────────────────────────────────────── */
/*  CUSTOM NAME MODAL                                           */
/* ──────────────────────────────────────────────────────────── */

const nameModal     = document.getElementById('name-modal');
const nameInput     = document.getElementById('name-input');
const nameSaveBtn   = document.getElementById('name-save-btn');
const nameCancelBtn = document.getElementById('name-cancel-btn');

function openNameModal() {
  nameInput.value = load(KEYS.NAME, '');
  nameModal.classList.add('is-open');
  nameInput.focus();
}

function closeNameModal() {
  nameModal.classList.remove('is-open');
}

function saveName() {
  const name = nameInput.value.trim();
  save(KEYS.NAME, name);
  updateClock();
  closeNameModal();
}

editNameBtn.addEventListener('click', openNameModal);
nameSaveBtn.addEventListener('click', saveName);
nameCancelBtn.addEventListener('click', closeNameModal);

nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') closeNameModal();
});

// Show modal on first visit if no name saved
if (!load(KEYS.NAME, null)) {
  setTimeout(openNameModal, 600);
}

/* ──────────────────────────────────────────────────────────── */
/*  LIGHT / DARK MODE                                           */
/* ──────────────────────────────────────────────────────────── */

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconEl    = document.getElementById('theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  save(KEYS.THEME, next);
  applyTheme(next);
}

themeToggleBtn.addEventListener('click', toggleTheme);

// Apply stored theme on load (prefer stored, then system preference)
(function initTheme() {
  const stored = load(KEYS.THEME, null);
  if (stored) {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
})();

/* ──────────────────────────────────────────────────────────── */
/*  FOCUS TIMER (Pomodoro) — configurable duration             */
/* ──────────────────────────────────────────────────────────── */

const timerMinEl      = document.getElementById('timer-minutes');
const timerSecEl      = document.getElementById('timer-seconds');
const timerStartBtn   = document.getElementById('timer-start-btn');
const timerStopBtn    = document.getElementById('timer-stop-btn');
const timerResetBtn   = document.getElementById('timer-reset-btn');
const timerStatusEl   = document.getElementById('timer-status');
const timerProgressBar = document.getElementById('timer-progress-bar');
const timerProgressWrap = timerProgressBar.parentElement;
const durationInput   = document.getElementById('pomodoro-duration');

let timerInterval    = null;
let timerTotalSecs   = 25 * 60;
let timerRemaining   = timerTotalSecs;
let timerRunning     = false;

function getConfiguredDuration() {
  const val = parseInt(durationInput.value, 10);
  if (isNaN(val) || val < 1) return 25;
  if (val > 120) return 120;
  return val;
}

function updateTimerDisplay() {
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  timerMinEl.textContent = pad(m);
  timerSecEl.textContent = pad(s);

  // Update progress bar
  const pct = timerTotalSecs > 0
    ? ((timerTotalSecs - timerRemaining) / timerTotalSecs) * 100
    : 0;
  timerProgressBar.style.width = pct + '%';
  timerProgressWrap.setAttribute('aria-valuenow', Math.round(pct));

  // Update tab title
  if (timerRunning) {
    document.title = `(${pad(m)}:${pad(s)}) Life Dashboard`;
  } else {
    document.title = 'Life Dashboard';
  }
}

function startTimer() {
  if (timerRunning) return;

  // If timer is at full (fresh or just reset), read the configured duration
  if (timerRemaining === timerTotalSecs) {
    timerTotalSecs = getConfiguredDuration() * 60;
    timerRemaining = timerTotalSecs;
  }

  if (timerRemaining <= 0) return;

  timerRunning = true;
  durationInput.disabled = true;
  timerStartBtn.disabled = true;
  timerStopBtn.disabled  = false;
  timerStatusEl.textContent = '🟢 Timer is running…';

  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();

    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStartBtn.disabled = false;
      timerStopBtn.disabled  = true;
      durationInput.disabled = false;
      timerStatusEl.textContent = '🎉 Time\'s up! Take a break.';
      document.title = 'Life Dashboard';
      // Audio beep via Web Audio API
      playBeep();
    }
  }, 1000);

  updateTimerDisplay();
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatusEl.textContent = '⏸ Paused — click Start to resume.';
  document.title = 'Life Dashboard';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerTotalSecs   = getConfiguredDuration() * 60;
  timerRemaining   = timerTotalSecs;
  durationInput.disabled = false;
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatusEl.textContent = '';
  document.title = 'Life Dashboard';
  updateTimerDisplay();
}

// Update timer when duration input changes (only if not running)
durationInput.addEventListener('change', () => {
  if (!timerRunning) {
    durationInput.value = getConfiguredDuration(); // clamp
    resetTimer();
  }
});

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Initial display
updateTimerDisplay();

/** Simple beep using Web Audio API */
function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (_) {
    // silently fail if AudioContext not available
  }
}

/* ──────────────────────────────────────────────────────────── */
/*  TO-DO LIST                                                  */
/* ──────────────────────────────────────────────────────────── */

const todoForm           = document.getElementById('todo-form');
const todoInput          = document.getElementById('todo-input');
const todoListEl         = document.getElementById('todo-list');
const todoCountEl        = document.getElementById('todo-count');
const clearCompletedBtn  = document.getElementById('clear-completed-btn');

/** @type {Array<{id:string, text:string, done:boolean}>} */
let todos = load(KEYS.TODOS, []);

function saveTodos() {
  save(KEYS.TODOS, todos);
}

function updateTodoCount() {
  const total = todos.length;
  const done  = todos.filter(t => t.done).length;
  todoCountEl.textContent = total === 0
    ? '0 tasks'
    : `${done}/${total} done`;
}

function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    todoListEl.innerHTML = `<li class="todo-empty">No tasks yet — add one above! 🌟</li>`;
    updateTodoCount();
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' todo-item--done' : '');
    li.dataset.id = todo.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as done`);
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--ghost btn--sm';
    editBtn.innerHTML = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.title = 'Edit task';
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, textSpan));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn--ghost btn--sm';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, textSpan, actions);
    todoListEl.appendChild(li);
  });

  updateTodoCount();
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({ id: uid(), text: trimmed, done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEditTodo(id, li, textSpan) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // Replace text span with an inline input
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.text;
  editInput.maxLength = 120;
  editInput.setAttribute('aria-label', 'Edit task text');

  li.replaceChild(editInput, textSpan);

  // Replace action buttons with save/cancel
  const actions = li.querySelector('.todo-actions');
  actions.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn--primary btn--sm';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => commitEdit(id, editInput.value));

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn--ghost btn--sm';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', renderTodos);

  actions.append(saveBtn, cancelBtn);
  editInput.focus();
  editInput.select();

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commitEdit(id, editInput.value);
    if (e.key === 'Escape') renderTodos();
  });
}

function commitEdit(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return;
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.text = trimmed;
    saveTodos();
    renderTodos();
  }
}

function clearCompleted() {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// Initial render
renderTodos();

/* ──────────────────────────────────────────────────────────── */
/*  QUICK LINKS                                                 */
/* ──────────────────────────────────────────────────────────── */

const linksForm      = document.getElementById('links-form');
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const linksGrid      = document.getElementById('links-grid');

/** @type {Array<{id:string, label:string, url:string}>} */
const DEFAULT_LINKS = [
  { id: uid(), label: 'Google',  url: 'https://google.com' },
  { id: uid(), label: 'YouTube', url: 'https://youtube.com' },
  { id: uid(), label: 'GitHub',  url: 'https://github.com' },
];
let links = load(KEYS.LINKS, null);

function saveLinks() {
  save(KEYS.LINKS, links);
}

/** Ensure URL has a scheme */
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = `<span class="links-empty">No links yet — add one above!</span>`;
    return;
  }

  links.forEach((link) => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href = link.url;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';
    chip.setAttribute('aria-label', `Open ${link.label}`);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = link.label;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-chip__delete';
    delBtn.innerHTML = '✕';
    delBtn.title = `Remove ${link.label}`;
    delBtn.setAttribute('aria-label', `Remove ${link.label}`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();  // don't follow the link
      e.stopPropagation();
      deleteLink(link.id);
    });

    chip.append(labelSpan, delBtn);
    linksGrid.appendChild(chip);
  });
}

function addLink(label, url) {
  const trimLabel = label.trim();
  const normUrl   = normalizeUrl(url);

  if (!trimLabel || !normUrl) return false;

  // Basic URL validity check
  try {
    new URL(normUrl);
  } catch {
    return false;
  }

  links.push({ id: uid(), label: trimLabel, url: normUrl });
  saveLinks();
  renderLinks();
  return true;
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

linksForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = addLink(linkNameInput.value, linkUrlInput.value);
  if (ok) {
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkNameInput.focus();
  } else {
    // Highlight invalid URL field
    linkUrlInput.focus();
    linkUrlInput.style.borderColor = 'var(--clr-danger)';
    setTimeout(() => { linkUrlInput.style.borderColor = ''; }, 1500);
  }
});

// Seed default links on first visit
if (links === null) {
  links = DEFAULT_LINKS;
  saveLinks();
}

// Initial render
renderLinks();
