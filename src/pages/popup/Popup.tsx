import { useState } from 'react';

export default function Popup() {
  const [transposition, setTransposition] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  const handleTranspose = () => {
    if (transposition === 0) {
      setMessage('Please select a transposition amount');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TRANSPOSE_CHORDS',
          semitones: transposition
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            setMessage('Content script not loaded. Try refreshing the page.');
          } else {
            setMessage('Chords transposed!');
          }
          setTimeout(() => setMessage(''), 2000);
        });
      }
    });
  };

  const handleReset = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'RESET_CHORDS'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            setMessage('Content script not loaded. Try refreshing the page.');
          } else {
            setTransposition(0);
            setMessage('Chords reset!');
          }
          setTimeout(() => setMessage(''), 2000);
        });
      }
    });
  };

  return (
    <div className="w-75 p-6 bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-lg shadow-lg">
      <div className="bg-blue-800 rounded-lg p-2 mb-6">
        <label className="block text-sm font-semibold mb-3">Transpose by (semitones):</label>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTransposition(transposition - 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
          >
            −
          </button>

          <input
            type="number"
            value={transposition}
            onChange={(e) => setTransposition(parseInt(e.target.value) || 0)}
            className="w-20 p-2 text-center text-black rounded font-bold text-lg"
            min="-11"
            max="11"
          />

          <button
            onClick={() => setTransposition(transposition + 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleTranspose}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 rounded font-bold transition text-white disabled:opacity-50"
          disabled={transposition === 0}
        >
          Transpose Chords
        </button>

        <button
          onClick={handleReset}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 rounded font-bold transition text-white"
        >
          Reset
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-green-600 rounded text-center text-sm font-semibold">
          {message}
        </div>
      )}
    </div>
  );
}