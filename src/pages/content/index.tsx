import { transposeElement, findChordsInElement } from '@utils/chordFinder';

// Declare chrome API
declare const chrome: any;

console.log('content script loaded');

// Store original content for reset functionality
let originalContent: Map<Element, string> = new Map();

interface TransposeMessage {
  type: 'TRANSPOSE_CHORDS' | 'RESET_CHORDS' | 'FIND_CHORDS';
  semitones?: number;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: (response: any) => void) => {
  const msg = request as TransposeMessage;
  
  if (msg.type === 'TRANSPOSE_CHORDS') {
    const semitones = msg.semitones || 0;
    
    // Save original content if not already saved
    if (originalContent.size === 0) {
      const body = document.body;
      originalContent.set(body, body.innerHTML);
    }

    // Transpose chords in the document
    const modifiedCount = transposeElement(document.body, semitones);
    console.log(`Transposed ${modifiedCount} text nodes`);
    
    sendResponse({
      success: true,
      message: `Transposed chords by ${semitones} semitones`
    });
  } else if (msg.type === 'RESET_CHORDS') {
    // Restore original content
    if (originalContent.has(document.body)) {
      const original = originalContent.get(document.body);
      if (original) {
        document.body.innerHTML = original;
        originalContent.clear();
      }
    }
    
    sendResponse({
      success: true,
      message: 'Chords reset to original'
    });
  } else if (msg.type === 'FIND_CHORDS') {
    // Find all chords on the page
    const chords = findChordsInElement(document.body);
    sendResponse({
      success: true,
      chords: Array.from(chords)
    });
  }
});

console.log('Chord transposer content script initialized');

