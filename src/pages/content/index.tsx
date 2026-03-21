import { transposeElement, findChordsInElement } from '@utils/chordFinder';

// Declare chrome API
declare const chrome: any;

console.log('[Chord Transposer] Content script loaded at:', window.location.href);

// Store original content for reset functionality
let originalContent: Map<Element, string> = new Map();

interface TransposeMessage {
  type: 'TRANSPOSE_CHORDS' | 'RESET_CHORDS' | 'FIND_CHORDS';
  semitones?: number;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: (response: any) => void) => {
  try {
    const msg = request as TransposeMessage;
    console.log('[Chord Transposer] Received message:', msg.type);

    if (msg.type === 'TRANSPOSE_CHORDS') {
      const semitones = msg.semitones || 0;

      // Save original content if not already saved
      if (originalContent.size === 0) {
        const body = document.body;
        originalContent.set(body, body.innerHTML);
      }

      // Transpose chords in the document
      const modifiedCount = transposeElement(document.body, semitones);
      console.log(`[Chord Transposer] Transposed ${modifiedCount} text nodes`);

      sendResponse({
        success: true,
        message: `Transposed chords by ${semitones} semitones`,
        modifiedCount
      });
    } else if (msg.type === 'RESET_CHORDS') {
      // Restore original content
      if (originalContent.has(document.body)) {
        const original = originalContent.get(document.body);
        if (original) {
          document.body.innerHTML = original;
          originalContent.clear();
          console.log('[Chord Transposer] Reset chords to original');
        }
      }

      sendResponse({
        success: true,
        message: 'Chords reset to original'
      });
    } else if (msg.type === 'FIND_CHORDS') {
      // Find all chords on the page
      const chords = findChordsInElement(document.body);
      console.log('[Chord Transposer] Found chords:', Array.from(chords));
      sendResponse({
        success: true,
        chords: Array.from(chords)
      });
    }
  } catch (error) {
    console.error('[Chord Transposer] Error processing message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Return true to indicate we will send response asynchronously if needed
  return true;
});

console.log('[Chord Transposer] Content script initialized and listening for messages');