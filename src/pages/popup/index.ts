import '@pages/popup/index.css';

// Declare chrome API
declare const chrome: any;

let transposition = 0;
let messageTimeout: number | null = null;

function showMessage(text: string): void {
  const root = document.querySelector('#__root');
  if (!root) return;

  let messageEl = root.querySelector('.message') as HTMLDivElement;
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'message';
    root.appendChild(messageEl);
  }

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
}

function handleTranspose(): void {
  if (transposition === 0) {
    showMessage('Please select a transposition amount');
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TRANSPOSE_CHORDS',
        semitones: transposition
      });
      showMessage('Chords transposed!');
    }
  });
}

function handleReset(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'RESET_CHORDS'
      });
      transposition = 0;
      updateDisplay();
      showMessage('Chords reset!');
    }
  });
}

function handleDecrease(): void {
  transposition--;
  updateDisplay();
}

function handleIncrease(): void {
  transposition++;
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
    </div>
  `;

  // Attach event listeners
  document.querySelector('.button-minus')?.addEventListener('click', handleDecrease);
  document.querySelector('.button-plus')?.addEventListener('click', handleIncrease);
  document.querySelector('input[type="number"]')?.addEventListener('change', handleInputChange);
  document.querySelector('.button-transpose')?.addEventListener('click', handleTranspose);
  document.querySelector('.button-reset')?.addEventListener('click', handleReset);
}

init();
