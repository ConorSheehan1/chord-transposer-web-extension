import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  transposeChord,
  transposeNote,
  detectChordsInText,
  transposeText,
  formatTransposition,
} from './chordTransposer.ts';

describe('transposeNote', () => {
  it('should transpose C up by 1 semitone to C#', () => {
    assert.strictEqual(transposeNote('C', 1), 'C#');
  });

  it('should transpose C up by 12 semitones back to C', () => {
    assert.strictEqual(transposeNote('C', 12), 'C');
  });

  it('should transpose C down by 12 semitones back to C', () => {
    assert.strictEqual(transposeNote('C', -12), 'C');
  });

  it('should transpose C down by 1 semitone to B', () => {
    assert.strictEqual(transposeNote('C', -1), 'B');
  });

  it('should transpose G up by 5 semitones to C', () => {
    assert.strictEqual(transposeNote('G', 5), 'C');
  });

  it('should not transpose when semitones is 0', () => {
    assert.strictEqual(transposeNote('D', 0), 'D');
  });

  it('should transpose C# up by 1 semitone to D', () => {
    assert.strictEqual(transposeNote('C#', 1), 'D');
  });

  it('should transpose F# up by 3 semitones to A', () => {
    assert.strictEqual(transposeNote('F#', 3), 'A');
  });

  it('should transpose A# down by 1 semitone to A', () => {
    assert.strictEqual(transposeNote('A#', -1), 'A');
  });

  it('should transpose Db (flat) up by 1 semitone to D', () => {
    assert.strictEqual(transposeNote('Db', 1), 'D');
  });

  it('should transpose Bb up by 2 semitones to C', () => {
    assert.strictEqual(transposeNote('Bb', 2), 'C');
  });

  it('should transpose Eb down by 1 semitone to D', () => {
    assert.strictEqual(transposeNote('Eb', -1), 'D');
  });

  it('should handle whitespace around notes', () => {
    assert.strictEqual(transposeNote('  C  ', 1), 'C#');
  });

  it('should return unchanged unknown notes', () => {
    assert.strictEqual(transposeNote('H', 1), 'H');
  });
});

describe('transposeChord', () => {
  it('should transpose C to D when up 2 semitones', () => {
    assert.strictEqual(transposeChord('C', 2), 'D');
  });

  it('should not transpose when semitones is 0', () => {
    assert.strictEqual(transposeChord('Cm', 0), 'Cm');
  });

  it('should preserve minor suffix', () => {
    assert.strictEqual(transposeChord('Cm', 2), 'Dm');
  });

  it('should preserve seventh suffix', () => {
    assert.strictEqual(transposeChord('C7', 2), 'D7');
  });

  it('should preserve maj7 suffix', () => {
    assert.strictEqual(transposeChord('Cmaj7', 2), 'Dmaj7');
  });

  it('should preserve sus4 suffix', () => {
    assert.strictEqual(transposeChord('Csus4', 2), 'Dsus4');
  });

  it('should preserve dim suffix', () => {
    assert.strictEqual(transposeChord('Cdim', 2), 'Ddim');
  });

  it('should preserve aug suffix', () => {
    assert.strictEqual(transposeChord('Caug', 2), 'Daug');
  });

  it('should preserve add9 suffix', () => {
    assert.strictEqual(transposeChord('Cadd9', 2), 'Dadd9');
  });

  it('should preserve complex suffixes like m7b9', () => {
    assert.strictEqual(transposeChord('Cm7b9', 2), 'Dm7b9');
  });

  it('should transpose both root and bass note', () => {
    assert.strictEqual(transposeChord('C/E', 2), 'D/F#');
  });

  it('should handle D/F# up 3 semitones to F/A', () => {
    assert.strictEqual(transposeChord('D/F#', 3), 'F/A');
  });

  it('should handle sharp bass notes', () => {
    assert.strictEqual(transposeChord('D/F#', 2), 'E/G#');
  });

  it('should handle chord suffix with bass note', () => {
    assert.strictEqual(transposeChord('Cm/E', 2), 'Dm/F#');
  });

  it('should transpose C# correctly', () => {
    assert.strictEqual(transposeChord('C#', 1), 'D');
  });

  it('should transpose Db correctly', () => {
    assert.strictEqual(transposeChord('Db', 1), 'D');
  });

  it('should preserve sharp in suffix positions', () => {
    assert.strictEqual(transposeChord('C7#5', 2), 'D7#5');
  });

  it('should transpose down by negative semitones', () => {
    assert.strictEqual(transposeChord('D', -2), 'C');
  });

  it('should handle complex downward transposition', () => {
    assert.strictEqual(transposeChord('Dmaj7', -2), 'Cmaj7');
  });

  it('should handle slash chords transposed down', () => {
    assert.strictEqual(transposeChord('D/F#', -2), 'C/E');
  });

  it('should handle empty string', () => {
    assert.strictEqual(transposeChord('', 5), '');
  });

  it('should handle octave-spanning transpositions', () => {
    assert.strictEqual(transposeChord('B', 1), 'C');
  });

  it('should handle negative octave-spanning transpositions', () => {
    assert.strictEqual(transposeChord('C', -1), 'B');
  });

  it('should transpose I-IV-V progression in C to D', () => {
    assert.strictEqual(transposeChord('C', 2), 'D');
    assert.strictEqual(transposeChord('F', 2), 'G');
    assert.strictEqual(transposeChord('G', 2), 'A');
  });

  it('should handle ii-V-I jazz progression', () => {
    assert.strictEqual(transposeChord('Dm7', 2), 'Em7');
    assert.strictEqual(transposeChord('G7', 2), 'A7');
    assert.strictEqual(transposeChord('Cmaj7', 2), 'Dmaj7');
  });

  it('should handle common pop progression: I-V-vi-IV', () => {
    assert.strictEqual(transposeChord('C', 2), 'D');
    assert.strictEqual(transposeChord('G', 2), 'A');
    assert.strictEqual(transposeChord('Am', 2), 'Bm');
    assert.strictEqual(transposeChord('F', 2), 'G');
  });
});

describe('detectChordsInText', () => {
  it('should detect simple chord', () => {
    const chords = detectChordsInText('The song starts with C');
    assert.ok(chords.includes('C'));
  });

  it('should detect multiple chords', () => {
    const chords = detectChordsInText('C F G7 C');
    assert.ok(chords.length > 0);
    assert.ok(chords.includes('C'));
    assert.ok(chords.includes('F'));
    assert.ok(chords.includes('G7'));
  });

  it('should detect flat chords', () => {
    const chords = detectChordsInText('Bb Ebmaj7');
    assert.ok(chords.includes('Bb'));
    assert.ok(chords.includes('Ebmaj7'));
  });

  it('should not detect single letters as chords', () => {
    const chords = detectChordsInText('The a b c song');
    const singleLetters = chords.filter(c => c.length === 1);
    assert.strictEqual(singleLetters.length, 0);
  });

  it('should handle mixed text and chords', () => {
    const chords = detectChordsInText('Verse: Em Am C G Chorus: Dm7');
    assert.ok(chords.includes('Em'));
    assert.ok(chords.includes('Am'));
    assert.ok(chords.includes('C'));
    assert.ok(chords.includes('G'));
    assert.ok(chords.includes('Dm7'));
  });
});

describe('transposeText', () => {
  it('should transpose chords in text', () => {
    const result = transposeText('The song uses C F G', 2);
    assert.ok(result.includes('D'));
    assert.ok(result.includes('G'));
    assert.ok(result.includes('A'));
  });

  it('should preserve non-chord text', () => {
    const result = transposeText('Verse in C with chords', 2);
    assert.ok(result.includes('Verse'));
    assert.ok(result.includes('with'));
    assert.ok(result.includes('chords'));
  });

  it('should handle complex chords in text', () => {
    const input = 'Em7 to Am7 to Dm7 to G7';
    const result = transposeText(input, 2);
    assert.ok(result.includes('F#m7'));
    assert.ok(result.includes('Bm7'));
    assert.ok(result.includes('Em7'));
    assert.ok(result.includes('A7'));
  });

  it('should not transpose when semitones is 0', () => {
    const original = 'C F G Am';
    const result = transposeText(original, 0);
    assert.strictEqual(result, original);
  });
});

describe('formatTransposition', () => {
  it('should format no transposition', () => {
    assert.strictEqual(formatTransposition(0), 'No transposition');
  });

  it('should format positive transposition', () => {
    assert.strictEqual(formatTransposition(1), 'Up 1 semitone');
    assert.strictEqual(formatTransposition(5), 'Up 5 semitones');
  });

  it('should format negative transposition', () => {
    assert.strictEqual(formatTransposition(-1), 'Down 1 semitone');
    assert.strictEqual(formatTransposition(-5), 'Down 5 semitones');
  });

  it('should handle large transpositions', () => {
    const result12 = formatTransposition(12);
    const resultNeg12 = formatTransposition(-12);
    assert.ok(result12.includes('Up'));
    assert.ok(resultNeg12.includes('Down'));
  });
});
