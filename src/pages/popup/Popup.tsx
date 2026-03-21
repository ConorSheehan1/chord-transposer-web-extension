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
        });
        setMessage('Chords transposed!');
        setTimeout(() => setMessage(''), 2000);
      }
    });
  };

  const handleReset = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'RESET_CHORDS'
        });
        setTransposition(0);
        setMessage('Chords reset!');
        setTimeout(() => setMessage(''), 2000);
      }
    });
  };

  const direction = transposition > 0 ? 'Up' : 'Down';
  const absValue = Math.abs(transposition);

  return (
    <div className="w-80 p-6 bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Chord Transposer</h1>

      <div className="bg-blue-800 rounded-lg p-4 mb-6">
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

        <div className="mt-3 text-center text-sm text-blue-200">
          {transposition === 0 ? (
            <span>No transposition selected</span>
          ) : (
            <span>{direction} {absValue} semitone{absValue !== 1 ? 's' : ''}</span>
          )}
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

      <div className="mt-6 pt-4 border-t border-blue-600 text-xs text-blue-300 text-center">
        <p>Set transposition amount and click "Transpose Chords"</p>
      </div>
    </div>
  );
}