import '@src/pages/popup/style.css';
import { transposeChord } from '@utils/chordTransposer';

// Declare chrome API
declare const chrome: any;

let transposition = 0;
let messageTimeout: number | null = null;
let detectedChords: string[] = [];
let contentScriptFailed = false;
let showAllChords = false;

function detectChords(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'FIND_CHORDS' },
        (response: any) => {
          const runtimeError = chrome.runtime?.lastError;
          contentScriptFailed = Boolean(runtimeError);
          if (runtimeError) {
            detectedChords = [];
            renderChordPreview();
            return;
          }
          if (response && response.success) {
            contentScriptFailed = false;
            detectedChords = response.chords || [];
            renderChordPreview();
          } else {
            detectedChords = [];
            renderChordPreview();
          }
        }
      );
    }
  });
}

function renderChordPreview(): void {
  const container = document.querySelector('.chord-preview-container');
  if (!container) return;

  if (detectedChords.length === 0) {
    const heading = contentScriptFailed
      ? 'The chord scanner did not initialize on this page.'
      : 'No chords detected on this page';
    container.innerHTML = `
      <div class="chord-preview-error">
        <p>${heading}</p>
        <ul>
          <li>Reload the page</li>
          <li>Reload the extension</li>
        </ul>
        ${contentScriptFailed ? '' : `<p>If the issue persists, <a href="https://github.com/ConorSheehan1/chord-transposer-web-extension/issues/new?template=bug_report.md">create an issue report.</a></p>`}
      </div>
    `;
    return;
  }

  const displayChords = showAllChords ? detectedChords : detectedChords.slice(0, 8);
  const transposedChords = transposition !== 0 ? displayChords.map(chord => transposeChord(chord, transposition)) : [];
  const hasMore = detectedChords.length > 8;

  container.innerHTML = `
    <div class="chord-preview">
      <p class="chord-count">Found ${detectedChords.length} chord${detectedChords.length !== 1 ? 's' : ''}</p>
      ${transposition !== 0 ? `
        <div class="transposed-preview-wrapper">
          <p class="chord-section-title">Transposed preview</p>
          <div class="chord-preview-note">This is a preview of how the chords will look if you apply the transposition.</div>
          <div class="chord-list">
            ${transposedChords.map(chord => `<span class="chord-tag">${chord}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      <div class="chord-preview-section detected-chords-section">
        <p class="chord-section-title">Detected chords</p>
        <div class="chord-list">
          ${displayChords.map(chord => `<span class="chord-tag">${chord}</span>`).join('')}
        </div>
        ${hasMore && !showAllChords ? `<button class="chord-expand-btn">Show all ${detectedChords.length} chords</button>` : ''}
        ${showAllChords ? `<button class="chord-collapse-btn">Show less</button>` : ''}
      </div>
    </div>
  `;

  const expandBtn = container.querySelector('.chord-expand-btn');
  const collapseBtn = container.querySelector('.chord-collapse-btn');

  expandBtn?.addEventListener('click', () => {
    showAllChords = true;
    renderChordPreview();
  });

  collapseBtn?.addEventListener('click', () => {
    showAllChords = false;
    renderChordPreview();
  });

}

function showMessage(text: string, type: 'success' | 'error' = 'success'): void {
  const root = document.querySelector('#__root');
  if (!root) return;
  const wrapper = root.querySelector('.message-wrapper');
  if (!wrapper) return;

  let messageEl = wrapper.querySelector('.message') as HTMLDivElement;
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'message';
    wrapper.appendChild(messageEl);
  }

  messageEl.classList.remove('success', 'error');
  messageEl.classList.add(type);

  messageEl.textContent = text;
  messageEl.style.display = 'block';

  if (messageTimeout !== null) {
    clearTimeout(messageTimeout);
  }

  messageTimeout = window.setTimeout(() => {
    messageEl.style.display = 'none';
    messageTimeout = null;
  }, 2000);
}

function updateDisplay(): void {
  const input = document.querySelector('input[type="number"]') as HTMLInputElement;
  const transposeBtn = document.querySelector('.button-transpose') as HTMLButtonElement;
  if (input) {
    input.value = String(transposition);
  }
  if (transposeBtn) {
    transposeBtn.disabled = transposition === 0;
  }
  renderChordPreview();
}

function handleTranspose(): void {
  if (transposition === 0) {
    showMessage('Please select a transposition amount', 'error');
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          type: 'TRANSPOSE_CHORDS',
          semitones: transposition
        },
        (response: any) => {
          if (response && response.success) {
            showMessage('Chords transposed!', 'success');
            detectChords();
          } else {
            showMessage('Unable to transpose chords.', 'error');
          }
        }
      );
    }
  });
}

function handleReset(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'RESET_CHORDS' },
        (response: any) => {
          if (response && response.success) {
            transposition = 0;
            updateDisplay();
            detectChords();
            showMessage('Chords reset!', 'success');
          } else {
            showMessage('Unable to reset chords.', 'error');
          }
        }
      );
    }
  });
}

function handleDecrease(): void {
  transposition = Math.max(transposition - 1, -11);
  updateDisplay();
}

function handleIncrease(): void {
  transposition = Math.min(transposition + 1, 11);
  updateDisplay();
}

function handleInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  transposition = parseInt(input.value) || 0;
  // Clamp to valid range
  if (transposition < -11) transposition = -11;
  if (transposition > 11) transposition = 11;
  updateDisplay();
}

function openOptionsPage(): void {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('src/pages/options/index.html'), '_blank');
  }
}

function init(): void {
  const root = document.querySelector('#__root');
  if (!root) throw new Error("Can't find Popup root element");

  root.innerHTML = `
    <div class="container">
      <div class="control-group">
        <label class="label">Transpose by (semitones):</label>
        <div class="input-group">
          <button class="button-minus">−</button>
          <input type="number" min="-11" max="11" value="0" />
          <button class="button-plus">+</button>
        </div>
      </div>
      <div class="buttons-container">
        <button class="button-transpose" disabled>Transpose Chords</button>
        <button class="button-reset">Reset</button>
      </div>
      <div class="message-wrapper"></div>
      <div class="chord-preview-container"></div>
      <button class="button-options">Extension settings</button>
    </div>
  `;

  // Attach event listeners
  document.querySelector('.button-minus')?.addEventListener('click', handleDecrease);
  document.querySelector('.button-plus')?.addEventListener('click', handleIncrease);
  document.querySelector('input[type="number"]')?.addEventListener('change', handleInputChange);
  document.querySelector('.button-transpose')?.addEventListener('click', handleTranspose);
  document.querySelector('.button-reset')?.addEventListener('click', handleReset);
  document.querySelector('.button-options')?.addEventListener('click', openOptionsPage);

  // Detect chords on load
  detectChords();
}

init();
