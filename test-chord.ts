import { transposeChord } from './src/utils/chordTransposer';

console.log('Testing D/F# + 3 semitones:');
const result = transposeChord('D/F#', 3);
console.log(`Result: ${result}`);
console.log(`Expected: F/A (or F/Bb)`);
