document.addEventListener('DOMContentLoaded', () => {

// ── Knowledge Base (Dictionaries) ─────────────────────────────
const dictionaries = {
  actionVerbs: [
    'define', 'list', 'recall', 'state', 'name', 
    'explain', 'describe', 'summarize', 'classify', 
    'apply', 'solve', 'demonstrate', 'use', 'execute', 
    'analyze', 'compare', 'differentiate', 'examine', 
    'evaluate', 'judge', 'justify', 'critique', 'assess', 
    'design', 'develop', 'construct', 'formulate', 'create'
  ],
  vague: ['understand', 'know', 'learn', 'appreciate', 'familiarize', 'realize', 'aware', 'study', 'grasp'],
  measurability: ['using', 'by', 'through', 'with', 'applying', 'based on', 'accuracy', 'efficiency']
};

// ── DOM References ────────────────────────────────────────────
const coListContainer = document.getElementById('co-list-container');
const addCoBtn        = document.getElementById('add-co-btn');
const analyzeBtn      = document.getElementById('analyze-btn');
const clearBtn        = document.getElementById('clear-btn');
const exportBtn       = document.getElementById('export-btn');

const highlightedOut  = document.getElementById('highlighted-output');
const statusEl        = document.getElementById('analysis-status');
const feedbackList    = document.getElementById('feedback-list');
const feedbackCount   = document.getElementById('feedback-count');

const metricLevel         = document.getElementById('metric-level');
const metricVerbs         = document.getElementById('metric-verbs');
const metricMeasurability = document.getElementById('metric-measurability');
const metricScore         = document.getElementById('metric-score');
const levelSegments       = document.querySelectorAll('.bloom-seg');

// ── State Management (Local Storage & Data Array) ─────────────
let coDataArray = [];

function initApp() {
  const savedData = localStorage.getItem('co_analyzer_drafts');
  if (savedData) {
    coDataArray = JSON.parse(savedData);
  } else {
    coDataArray = ['']; 
  }
  renderCoInputs();
}

function saveState() {
  localStorage.setItem('co_analyzer_drafts', JSON.stringify(coDataArray));
}

// ── Dynamic UI Engine ─────────────────────────────────────────
function renderCoInputs() {
  coListContainer.innerHTML = ''; 
  
  coDataArray.forEach((text, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'dynamic-co-item';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control';
    textarea.rows = 4; 
    textarea.placeholder = `CO ${index + 1}: Students will be able to...`;
    textarea.value = text;
    
    textarea.addEventListener('input', (e) => {
      coDataArray[index] = e.target.value;
      saveState();
    });

    itemDiv.appendChild(textarea);

    if (coDataArray.length > 1) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-co-btn';
      deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      deleteBtn.title = "Remove this CO";
      deleteBtn.addEventListener('click', () => {
        coDataArray.splice(index, 1);
        saveState();
        renderCoInputs();
      });
      itemDiv.appendChild(deleteBtn);
    }

    coListContainer.appendChild(itemDiv);
  });
}

addCoBtn.addEventListener('click', () => {
  coDataArray.push('');
  saveState();
  renderCoInputs();
  coListContainer.scrollTop = coListContainer.scrollHeight;
});

clearBtn.addEventListener('click', () => {
  coDataArray = [''];
  saveState();
  renderCoInputs();
  resetResults();
});

exportBtn.addEventListener('click', () => {
  window.print();
});

// ── Batch Analyze Engine ──────────────────────────────────────
analyzeBtn.addEventListener('click', () => {
  const activeCOs = coDataArray.filter(text => text.trim() !== '');
  if (activeCOs.length === 0) return;

  setStatus('running', 'Analyzing Batch...');
  analyzeBtn.disabled = true;

  setTimeout(() => {
    let globalFoundVerbs = [];
    let globalIssues = [];
    let totalScore = 0;
    let anyMeasurable = false;
    let highestCognitiveLevel = 0;
    let finalHTMLOutput = ''; // Stores the final rendered HTML
    
    // Process each CO individually
    activeCOs.forEach(coText => {
      const lowerText = coText.toLowerCase();
      let isMeasurable = false;
      let coScore = 100;
      let coHasVerb = false;
      
      let highlightedText = coText;

      // 1. Scan for Vague Words first
      dictionaries.vague.forEach(vagueWord => {
        const regex = new RegExp(`\\b${vagueWord}\\b`, 'gi');
        if (regex.test(lowerText)) {
          if (!globalIssues.includes(vagueWord)) globalIssues.push(vagueWord);
          coScore -= 30;
          highlightedText = highlightedText.replace(regex, m => `<span class="hl-error">${m}</span>`);
        }
      });

      // 2. Scan for Action Verbs
      dictionaries.actionVerbs.forEach((verb, index) => {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        if (regex.test(lowerText)) {
          coHasVerb = true;
          if (!globalFoundVerbs.includes(verb)) globalFoundVerbs.push(verb);
          let level = Math.ceil((index + 1) / 5); 
          if(level > highestCognitiveLevel) highestCognitiveLevel = level;
          
          highlightedText = highlightedText.replace(regex, m => `<span class="hl-verb">${m}</span>`);
        }
      });

      // 3. Check Measurability
      isMeasurable = dictionaries.measurability.some(keyword => lowerText.includes(keyword));
      if (isMeasurable) anyMeasurable = true;
      if (!isMeasurable) coScore -= 20;

      // 4. Construct Output Block for this specific CO
      if (!coHasVerb) {
        coScore -= 40;
        finalHTMLOutput += `<div class="hl-statement-error">${highlightedText} <span class="error-tag-text">[Missing Action Verb]</span></div>`;
      } else {
        finalHTMLOutput += `<div class="co-output-block">${highlightedText}</div>`;
      }

      totalScore += Math.max(0, coScore);
    });

    const finalScore = Math.round(totalScore / activeCOs.length);

    // Generate Global Feedback
    let feedbackItems = [];
    if (globalIssues.length > 0) {
      feedbackItems.push({ type: 'error', title: 'Vague Terms Detected', body: `Found unmeasurable verbs: "<b>${globalIssues.join(', ')}</b>". Replace them with concrete actions.` });
    }
    
    // Removed Bloom's Taxonomy reference
    if (globalFoundVerbs.length === 0) {
      feedbackItems.push({ type: 'error', title: 'Missing Action Verbs', body: 'Your statements are missing valid, measurable action verbs.' });
    } else {
      feedbackItems.push({ type: 'success', title: 'Action Verbs Present', body: `Successfully identified action verbs across statements: "<b>${globalFoundVerbs.join(', ')}</b>".` });
    }
    
    if (!anyMeasurable) {
      feedbackItems.push({ type: 'warning', title: 'Measurability Warning', body: 'Statements lack clear measurement criteria or methodology (e.g., "...using Python").' });
    }

    // Update UI
    levelSegments.forEach(seg => seg.classList.remove('active'));
    if (highestCognitiveLevel > 0 && highestCognitiveLevel <= 6) {
        levelSegments[highestCognitiveLevel - 1].classList.add('active');
        metricLevel.className = 'badge badge-pill badge-success';
        metricLevel.textContent = `L${highestCognitiveLevel} Highest`;
    }

    setStatus('done', 'Complete');
    analyzeBtn.disabled = false;
    exportBtn.style.display = 'inline-flex';
    
    // Inject the individually processed blocks
    highlightedOut.className = 'rich-text-box';
    highlightedOut.innerHTML = finalHTMLOutput;
    
    setMetrics({ verbs: globalFoundVerbs.length, measurability: anyMeasurable ? 'High' : 'Low', score: finalScore });
    renderFeedback(feedbackItems);

  }, 800);
});

// ── Helpers ───────────────────────────────────────────────────
function setStatus(type, label) {
  statusEl.className = `status-indicator status-${type}`;
  statusEl.textContent = label;
}

function resetResults() {
  highlightedOut.className = 'rich-text-box empty-state';
  highlightedOut.innerHTML = `
    <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
    <p class="empty-text">Awaiting input for structural evaluation.</p>`;
  [metricLevel, metricVerbs, metricMeasurability].forEach(el => {
    el.className = 'badge badge-pill badge-pending';
    el.textContent = el.id === 'metric-verbs' ? '0' : 'Pending';
  });
  metricScore.textContent = '—';
  levelSegments.forEach(seg => seg.classList.remove('active'));
  exportBtn.style.display = 'none';
  feedbackList.innerHTML = `<div class="feedback-placeholder"><p>Run analysis to receive actionable feedback.</p></div>`;
  feedbackCount.textContent = '0 suggestions';
  setStatus('idle', 'Idle');
}

function setMetrics({ verbs, measurability, score }) {
  metricVerbs.textContent = verbs;
  metricVerbs.className = `badge badge-pill ${verbs > 0 ? 'badge-success' : 'badge-error'}`;
  metricMeasurability.textContent = measurability;
  metricMeasurability.className = `badge badge-pill ${measurability === 'High' ? 'badge-success' : 'badge-error'}`;
  metricScore.textContent = score;
}

function renderFeedback(items) {
  feedbackCount.textContent = `${items.length} suggestion${items.length !== 1 ? 's' : ''}`;
  if (!items.length) {
    feedbackList.innerHTML = `<div class="feedback-placeholder"><p>No issues found — great CO statement!</p></div>`;
    return;
  }
  const icons = {
    success: `<svg class="feedback-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg class="feedback-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error:   `<svg class="feedback-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  };
  feedbackList.innerHTML = items.map(item => `
    <div class="feedback-item feedback-${item.type}">
      ${icons[item.type]}
      <div class="feedback-item-text">
        <strong>${item.title}</strong>
        ${item.body}
      </div>
    </div>`).join('');
}

initApp();

});