// Chord transposition utility

// Define all notes in chromatic scale
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Alternative note names (flats converted to sharps)
const NOTE_ALIASES: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

// Map of semitone index to all possible note names
const SEMITONE_TO_NOTES: Record<number, string[]> = {
  0: ['C'],
  1: ['C#', 'Db'],
  2: ['D'],
  3: ['D#', 'Eb'],
  4: ['E'],
  5: ['F'],
  6: ['F#', 'Gb'],
  7: ['G'],
  8: ['G#', 'Ab'],
  9: ['A'],
  10: ['A#', 'Bb'],
  11: ['B'],
};

/**
 * Transposes a single note by the given number of semitones
 * @param note - The note to transpose (e.g., "C", "F#", "Bb")
 * @param semitones - Number of semitones to transpose
 * @returns The transposed note
 */
export function transposeNote(note: string, semitones: number): string {
  // Trim whitespace
  note = note.trim();

  // Normalize flat notes to sharp equivalents
  let normalizedNote = note;
  if (normalizedNote.includes('b')) {
    normalizedNote = NOTE_ALIASES[normalizedNote] || normalizedNote;
  }

  // Find the current note index
  let noteIndex = NOTES.indexOf(normalizedNote);
  if (noteIndex === -1) {
    // Unknown note, return unchanged
    return note;
  }

  // Transpose the note
  noteIndex = ((noteIndex + semitones) % NOTES.length + NOTES.length) % NOTES.length;

  // Get the transposed note's semitone value
  const transposedSemitone = noteIndex;

  // Determine if original used sharps or flats
  const hadSharp = note.includes('#');
  const hadFlat = note.includes('b');

  // Get available names for this semitone
  let possibleNames = SEMITONE_TO_NOTES[transposedSemitone];
  if (!possibleNames || possibleNames.length === 0) {
    possibleNames = [NOTES[transposedSemitone]];
  }

  // Fallback if still undefined
  if (!possibleNames || possibleNames.length === 0) {
    return NOTES[transposedSemitone] || note;
  }

  // Choose the representation:
  // - If original had sharps, prefer sharp version
  // - If original had flats, prefer flat version
  // - Otherwise use the first available (usually natural or sharp)
  if (hadFlat && possibleNames.length > 1 && possibleNames[possibleNames.length - 1]) {
    // Prefer flat version for bass notes/transposed notes from flats
    return possibleNames[possibleNames.length - 1]; // Flat is usually last
  } else if (hadSharp && possibleNames[0] && possibleNames[0].includes('#')) {
    return possibleNames[0]; // Sharp is usually first
  }

  return possibleNames[0] || NOTES[transposedSemitone] || note;
}

/**
 * Transposes a single chord by the given number of semitones
 * @param chord - The chord to transpose (e.g., "C", "Cm", "Cmaj7", "C#dim", "D/F#")
 * @param semitones - Number of semitones to transpose (can be negative)
 * @returns The transposed chord
 */
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) {
    return chord;
  }

  // Check if the chord contains a slash notation (e.g., "D/F#")
  let rootChord = chord;
  let bassNote = '';

  if (chord.includes('/')) {
    const parts = chord.split('/');
    rootChord = parts[0].trim();
    bassNote = parts[1].trim();
  }

  // Extract the root note and the rest of the chord
  let rootNote = '';
  let chordSuffix = '';

  // Check for two-character root notes (e.g., C#, Db, F#, etc.)
  if (rootChord.length >= 2) {
    const potentialRoot = rootChord.substring(0, 2);
    if (potentialRoot[1] === '#' || potentialRoot[1] === 'b') {
      rootNote = potentialRoot;
      chordSuffix = rootChord.substring(2);
    } else {
      rootNote = rootChord[0];
      chordSuffix = rootChord.substring(1);
    }
  } else if (rootChord.length === 1) {
    rootNote = rootChord;
    chordSuffix = '';
  }

  // Transpose the root note
  const transposedRoot = transposeNote(rootNote, semitones);
  const transposedChord = transposedRoot + chordSuffix;

  // If there's a bass note, transpose it too
  if (bassNote) {
    const transposedBass = transposeNote(bassNote, semitones);
    return transposedChord + '/' + transposedBass;
  }

  return transposedChord;
}

/**
 * Detects and extracts chords from text
 * Common chord patterns: C, Cm, C7, Cmaj7, Cdim, Caug, Csus2, Csus4, etc.
 * @param text - The text to search for chords
 * @returns Array of detected chords
 */
export function detectChordsInText(text: string): string[] {
  // Pattern to match chords:
  // - Root note (A-G, optionally followed by single # or b)
  // - Optional chord suffix (m, 7, maj7, min7, dim, aug, sus2, sus4, add9, etc.)
  // - Optional bass note after slash
  // Use lookahead instead of \b at end since # is not a word character
  const chordPattern = /\b([A-G](?:[#b])?(?:m(?:aj)?(?:7|9|11|13)?|min|dim|aug|sus[24]|add\d|7(?:b\d|#\d)?|maj\d?)?)(?:\/[A-G](?:[#b])?)?(?=\s|$|[^\w#])/g;

  const chords = text.match(chordPattern) || [];

  // Filter out single letters that are clearly not chords
  // Accept: C, C#, Cm, C7, D/F#, etc.
  // Reject: "a", "b", "c" (lowercase or single letters in middle of words)
  return chords.filter(chord => {
    // Always accept if it has a suffix (m, 7, major, sus, etc.) or slash
    if (chord.length > 1 && (chord[1] === '#' || chord[1] === 'b' || chord.includes('/') || /[m0-9]/.test(chord[1]))) {
      return true;
    }
    // Accept single capital letters as chords (C, D, E, etc.)
    if (chord.length === 1 && /[A-G]/.test(chord)) {
      return true;
    }
    return false;
  });
}

/**
 * Transposes all chords in a given text string
 * @param text - The text containing chords
 * @param semitones - Number of semitones to transpose
 * @returns Text with transposed chords
 */
export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) {
    return text;
  }

  const chordPattern = /\b([A-G](?:[#b])?(?:m(?:aj)?(?:7|9|11|13)?|min|dim|aug|sus[24]|add\d|7(?:b\d|#\d)?|maj\d?)?)(?:\/[A-G](?:[#b])?)?(?=\s|$|[^\w#])/g;

  return text.replace(chordPattern, (match) => transposeChord(match, semitones));
}

/**
 * Converts semitones to a more readable format
 * @param semitones - Number of semitones
 * @returns Readable representation
 */
export function formatTransposition(semitones: number): string {
  if (semitones === 0) return 'No transposition';

  const direction = semitones > 0 ? 'Up' : 'Down';
  const absValue = Math.abs(semitones);

  return `${direction} ${absValue} semitone${absValue !== 1 ? 's' : ''}`;
}
