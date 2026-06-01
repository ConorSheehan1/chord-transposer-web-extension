import '@src/pages/options/style.css';

// Declare chrome API
declare const chrome: any;

const DEFAULT_IGNORE_CLASSES = ['NC05z'];
let ignoreClasses: string[] = [];

function getStorageArea() {
  return chrome.storage?.sync || chrome.storage?.local;
}

function showMessage(text: string): void {
  const messageEl = document.querySelector('.message') as HTMLDivElement;
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.style.display = 'block';
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 2000);
}

function saveIgnoreClasses(): void {
  const storageArea = getStorageArea();
  if (!storageArea) return;

  storageArea.set({ ignoreClasses }, () => {
    showMessage('Ignore classes saved.');
    notifyActiveTab();
  });
}

function notifyActiveTab(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_IGNORE_CLASSES',
        ignoreClasses
      });
    }
  });
}

function renderOptions(): void {
  const list = document.querySelector('.ignore-class-list');
  const input = document.querySelector('.ignore-class-input') as HTMLInputElement;
  if (!list || !input) return;

  list.innerHTML = ignoreClasses.map((cls, idx) => `
    <div class="ignore-class-item">
      <span class="ignore-class-name">${cls}</span>
      <button class="remove-class-btn" data-index="${idx}">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.remove-class-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const idx = parseInt((event.target as HTMLElement).getAttribute('data-index') || '0', 10);
      ignoreClasses.splice(idx, 1);
      renderOptions();
      saveIgnoreClasses();
    });
  });

  document.querySelector('.add-class-btn')?.addEventListener('click', () => {
    const value = input.value.trim();
    if (value && !ignoreClasses.includes(value)) {
      ignoreClasses.push(value);
      input.value = '';
      renderOptions();
      saveIgnoreClasses();
    }
  });
}

function loadIgnoreClasses(): void {
  const storageArea = getStorageArea();
  if (!storageArea) {
    ignoreClasses = DEFAULT_IGNORE_CLASSES;
    renderOptions();
    return;
  }

  storageArea.get({ ignoreClasses: DEFAULT_IGNORE_CLASSES }, (result: any) => {
    ignoreClasses = Array.isArray(result.ignoreClasses) ? result.ignoreClasses : DEFAULT_IGNORE_CLASSES;
    renderOptions();
  });
}

function init(): void {
  const root = document.querySelector('#__root');
  if (!root) throw new Error("Can't find Options root element");

  root.innerHTML = `
    <div class="container">
      <div class="card">
        <h1 class="title">Chord Transposer Settings</h1>
        <p class="description">Ignore chords inside elements with these container classes.</p>
        <div class="ignore-class-list"></div>
        <div class="form-row">
          <input class="ignore-class-input" type="text" placeholder="Enter class name..." />
          <button class="add-class-btn" type="button">Add</button>
        </div>
        <p class="meta">Default ignored class: NC05z</p>
        <div class="message" style="display:none;"></div>
      </div>
    </div>
  `;

  loadIgnoreClasses();
}

init();
