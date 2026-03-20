// ── QWV Sabiqun Form · v2 ────────────────────────────────
// Vanilla JS · Firebase Firestore · Draft Persistence

// ── Firebase Config — replace with your own ──────────────
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB221Gxn20Y0e-yEUHJbvZIIpEosECGNBk",
    authDomain: "rc-feedback.firebaseapp.com",
    projectId: "rc-feedback",
    storageBucket: "rc-feedback.firebasestorage.app",
    messagingSenderId: "897555959222",
    appId: "1:897555959222:web:801b1cc77d371699198517",
};

// ── Storage keys ──────────────────────────────────────────
const DRAFT_KEY   = 'qwv_sabiqun_draft';
const SECTION_KEY = 'qwv_sabiqun_section';

// ── State ─────────────────────────────────────────────────
const state = {
  currentSection: 0,
  totalSections: 4,
  answers: {},
  submitted: false,
  startTime: Date.now(),
};

const SECTIONS = [
  { hi: "क्या आप मौजूद रहे?",        en: "Did you show up?" },
  { hi: "क्या आयतें दिल में उतरीं?",  en: "Did the āyāt land?" },
  { hi: "क्या कुछ बदला?",              en: "Did something change?" },
  { hi: "आपका दिल कहाँ है?",          en: "Where is your heart?" },
];

// ══════════════════════════════════════════════════════════
// DRAFT PERSISTENCE
// ══════════════════════════════════════════════════════════

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY,   JSON.stringify(state.answers));
    localStorage.setItem(SECTION_KEY, String(state.currentSection));
  } catch (e) { /* localStorage blocked — silent fail */ }
}

function loadDraft() {
  try {
    const raw     = localStorage.getItem(DRAFT_KEY);
    const section = localStorage.getItem(SECTION_KEY);
    if (!raw) return null;
    return {
      answers:     JSON.parse(raw),
      lastSection: section ? parseInt(section, 10) : 1,
    };
  } catch (e) { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(SECTION_KEY);
}

// Re-populate DOM fields from saved answers
function restoreAnswersToDOM(answers) {
  Object.entries(answers).forEach(([qid, value]) => {

    // ── Text / textarea ──────────────────────────────────
    // Match any element whose oninput attribute contains the qid
    const textEl = document.querySelector(`[oninput*="'${qid}'"]`);
    if (textEl && typeof value === 'string') {
      textEl.value = value;
      return;
    }

    // ── Single-select radio ──────────────────────────────
    // Find the option-item whose onclick contains both the qid and the value
    if (typeof value === 'string') {
      // Scan all option-items and match by parsing onclick
      document.querySelectorAll('.option-item:not(.checkbox-item)').forEach(opt => {
        const oc = opt.getAttribute('onclick') || '';
        if (oc.includes(`'${qid}'`) && oc.includes(`'${value}'`)) {
          opt.classList.add('selected');
        }
      });
    }

    // ── Multi-select checkbox (array) ────────────────────
    if (Array.isArray(value)) {
      value.forEach(v => {
        document.querySelectorAll('.checkbox-item').forEach(opt => {
          const oc = opt.getAttribute('onclick') || '';
          if (oc.includes(`'${qid}'`) && (opt.getAttribute('data-value') === v || oc.includes(`'${v}'`))) {
            opt.classList.add('selected');
          }
        });
      });
    }

    // ── Scale (number) ───────────────────────────────────
    if (typeof value === 'number') {
      document.querySelectorAll('.scale-btn').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        if (oc.includes(`'${qid}'`) && oc.includes(`,${value},`)) {
          btn.classList.add('selected');
        }
      });
    }
  });
}

// Draft continue banner on cover screen
function showDraftBanner(lastSection) {
  const cover = document.querySelector('.cover');
  if (!cover || document.getElementById('draft-banner')) return;

  const sectionName = SECTIONS[Math.max(0, lastSection - 1)]?.hi || 'पिछला सवाल';
  const wrap = document.createElement('div');
  wrap.id = 'draft-banner';
  wrap.innerHTML = `
    <div class="draft-banner">
      <div class="draft-banner-body">
        <div class="draft-banner-hi">✦ &nbsp;आपके जवाब सुरक्षित हैं</div>
        <div class="draft-banner-section">${sectionName} तक · Progress saved</div>
      </div>
      <div class="draft-banner-actions">
        <button class="draft-continue" onclick="continueDraft()">जारी रखें →</button>
        <button class="draft-restart" onclick="restartForm()">नया शुरू करें</button>
      </div>
    </div>
  `;

  const cta = cover.querySelector('#cover-cta');
  if (cta) cover.insertBefore(wrap, cta);
}

function continueDraft() {
  const draft = loadDraft();
  if (!draft) return;
  state.answers = draft.answers;
  showScreen('form');
  showSection(draft.lastSection);   // restore fires inside showSection
}

function restartForm() {
  clearDraft();
  state.answers = {};
  const banner = document.getElementById('draft-banner');
  if (banner) banner.remove();
}

// ══════════════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════════════

function initTheme() {
  setTheme(localStorage.getItem('qwv_theme') || 'dark');
}

function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('qwv_theme', mode);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = mode === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// ══════════════════════════════════════════════════════════
// FIREBASE
// ══════════════════════════════════════════════════════════

function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    window.db = firebase.firestore();
  } catch (e) {
    window.db = null;
    console.warn('Firebase unavailable — offline mode');
  }
}

// ══════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFirebase();
  bindEvents();
  showScreen('cover');

  // Restore draft if exists
  const draft = loadDraft();
  if (draft && Object.keys(draft.answers).length > 0) {
    state.answers = draft.answers;
    showDraftBanner(draft.lastSection);
  }
});

// ══════════════════════════════════════════════════════════
// SCREENS & SECTIONS
// ══════════════════════════════════════════════════════════

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) { el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

function showSection(num) {
  state.currentSection = num;
  document.querySelectorAll('.form-section').forEach(s => s.style.display = 'none');
  const sec = document.getElementById('section-' + num);
  if (sec) {
    sec.style.display = 'block';
    sec.querySelectorAll('.question-card, .section-header, .note-strip, .ayah-callout').forEach((el, i) => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
      el.style.animationDelay = (i * 0.06) + 's';
    });
  }
  updateProgress();
  saveDraft();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Always restore saved answers into the newly visible section
  setTimeout(() => restoreAnswersToDOM(state.answers), 80);
}

function updateProgress() {
  const sec  = state.currentSection;
  const pct  = Math.round((sec / state.totalSections) * 100);
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('progress-section-label');
  const count = document.getElementById('progress-count');
  if (fill)  fill.style.width = pct + '%';
  if (count) count.textContent = sec + ' / ' + state.totalSections;
  if (label && SECTIONS[sec - 1]) label.textContent = SECTIONS[sec - 1].hi;
}

// ══════════════════════════════════════════════════════════
// ANSWER CAPTURE — saveDraft() after every interaction
// ══════════════════════════════════════════════════════════

function selectOption(qid, value, el) {
  el.closest('.question-card').querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  state.answers[qid] = value;
  el.closest('.question-card').classList.remove('error');
  saveDraft();
}

function toggleCheckbox(qid, value, el) {
  el.classList.toggle('selected');
  const card     = el.closest('.question-card');
  const selected = [...card.querySelectorAll('.option-item.selected')]
    .map(item => item.getAttribute('data-value'));
  state.answers[qid] = selected.length > 0 ? selected : null;
  if (selected.length > 0) card.classList.remove('error');
  saveDraft();
}

function selectScale(qid, value, el) {
  el.closest('.scale-track').querySelectorAll('.scale-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  state.answers[qid] = value;
  el.closest('.question-card').classList.remove('error');
  saveDraft();
}

function onTextInput(qid, el) {
  state.answers[qid] = el.value.trim();
  if (el.value.trim()) el.closest('.question-card').classList.remove('error');
  saveDraft();
}

// ══════════════════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════════════════

function validateSection(num) {
  const section  = document.getElementById('section-' + num);
  const required = section.querySelectorAll('.question-card[data-required="true"]');
  let valid = true;

  required.forEach(card => {
    const val = state.answers[card.dataset.qid];
    const empty = !val
      || (typeof val === 'string'  && !val.trim())
      || (Array.isArray(val)       && val.length === 0);
    if (empty) { card.classList.add('error'); valid = false; }
  });

  if (!valid) {
    const first = section.querySelector('.question-card.error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return valid;
}

// ══════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════

function goNext() {
  const cur = state.currentSection;

  if (cur === 0) {
    showScreen('form');
    showSection(1);
    return;
  }

  if (!validateSection(cur)) return;

  if (cur < state.totalSections) {
    showSection(cur + 1);
  } else {
    submitForm();
  }
}

function goPrev() {
  if (state.currentSection > 1) showSection(state.currentSection - 1);
}

// ══════════════════════════════════════════════════════════
// SUBMIT
// ══════════════════════════════════════════════════════════

async function submitForm() {
  if (state.submitted) return;

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'जमा हो रहा है...'; }

  const payload = {
    name:    state.answers['q0_name']    || '',
    contact: state.answers['q0_contact'] || '',
    ...state.answers,
    submitted_at:       new Date().toISOString(),
    time_taken_seconds: Math.round((Date.now() - state.startTime) / 1000),
    source:             'qwv-sabiqun-v2',
    ramadan_year:       1447,
  };

  state.submitted = true;
  clearDraft();                   // ← wipe draft on submit
  showScreen('thankyou');

  try {
    if (window.db) {
      await window.db.collection('sabiqun_responses').add(payload);
      console.log('✓ Saved to Firestore');
    } else {
      const pending = JSON.parse(localStorage.getItem('qwv_pending') || '[]');
      pending.push(payload);
      localStorage.setItem('qwv_pending', JSON.stringify(pending));
      console.log('✓ Saved locally');
    }
  } catch (err) {
    console.warn('Save error:', err.message);
  }
}

// ══════════════════════════════════════════════════════════
// EVENT BINDING
// ══════════════════════════════════════════════════════════

function bindEvents() {
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('cover-cta')?.addEventListener('click', goNext);
  document.getElementById('next-1')?.addEventListener('click', goNext);
  document.getElementById('next-2')?.addEventListener('click', goNext);
  document.getElementById('next-3')?.addEventListener('click', goNext);
  document.getElementById('prev-2')?.addEventListener('click', goPrev);
  document.getElementById('prev-3')?.addEventListener('click', goPrev);
  document.getElementById('prev-4')?.addEventListener('click', goPrev);
  document.getElementById('submit-btn')?.addEventListener('click', goNext);
}
