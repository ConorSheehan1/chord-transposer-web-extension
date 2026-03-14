// Utility to find and highlight chords in DOM elements

import { transposeChord } from './chordTransposer';

// Pattern to match chords with word boundaries
const CHORD_PATTERN = /\b([A-G](?:[#b])?(?:m(?:aj)?(?:7|9|11|13)?|min|dim|aug|sus[24]|add\d|7(?:b\d|#\d)?|maj\d?)?(?:\/[A-G](?:[#b])?)?)\b/g;

/**
 * Check if a text node contains chords and transpose them
 * @param node - Text node to process
 * @param semitones - Number of semitones to transpose
 * @returns true if the node was modified
 */
export function transposeTextNode(node: Text, semitones: number): boolean {
  if (semitones === 0) {
    return false;
  }

  const originalText = node.textContent || '';
  const transposedText = originalText.replace(CHORD_PATTERN, (match) => transposeChord(match, semitones));

  if (originalText !== transposedText) {
    node.textContent = transposedText;
    return true;
  }

  return false;
}

/**
 * Traverse DOM and transpose chords in text nodes
 * Skips script and style tags
 * @param element - DOM element to traverse
 * @param semitones - Number of semitones to transpose
 * @returns Number of nodes modified
 */
export function transposeElement(element: Element, semitones: number): number {
  if (semitones === 0) {
    return 0;
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);
  let modifiedCount = 0;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node;
  const nodesToProcess: Text[] = [];

  // First pass: collect nodes to avoid modifying while iterating
  while ((node = walker.nextNode())) {
    nodesToProcess.push(node as Text);
  }

  // Second pass: process nodes
  for (const textNode of nodesToProcess) {
    const parent = textNode.parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName)) {
      if (transposeTextNode(textNode, semitones)) {
        modifiedCount++;
      }
    }
  }

  return modifiedCount;
}

/**
 * Find all unique chords in an element
 * @param element - DOM element to search
 * @returns Set of unique chords found
 */
export function findChordsInElement(element: Element): Set<string> {
  const chords = new Set<string>();
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node;
  while ((node = walker.nextNode())) {
    const parent = (node as Text).parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName)) {
      const text = (node as Text).textContent || '';
      const matches = text.match(CHORD_PATTERN);
      if (matches) {
        matches.forEach(chord => chords.add(chord));
      }
    }
  }

  return chords;
}

/**
 * Highlight chords in an element with a specific style
 * @param element - DOM element to search
 * @param className - CSS class to apply to chord spans
 */
export function highlightChords(element: Element, className: string = 'chord-highlight'): void {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node;
  const nodesToProcess: Text[] = [];

  while ((node = walker.nextNode())) {
    nodesToProcess.push(node as Text);
  }

  // Process in reverse to maintain correct positions
  for (const textNode of nodesToProcess.reverse()) {
    const parent = textNode.parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName)) {
      const text = textNode.textContent || '';

      if (CHORD_PATTERN.test(text)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        CHORD_PATTERN.lastIndex = 0;
        while ((match = CHORD_PATTERN.exec(text)) !== null) {
          // Add text before chord
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }

          // Add chord wrapped in span
          const span = document.createElement('span');
          span.className = className;
          span.textContent = match[0];
          fragment.appendChild(span);

          lastIndex = CHORD_PATTERN.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        parent.replaceChild(fragment, textNode);
      }
    }
  }
}

/**
 * Remove chord highlighting from an element
 * @param element - DOM element to search
 * @param className - CSS class to remove
 */
export function removeChordHighlight(element: Element, className: string = 'chord-highlight'): void {
  const highlighted = element.querySelectorAll(`.${className}`);
  for (const span of highlighted) {
    const text = document.createTextNode(span.textContent || '');
    span.parentElement?.replaceChild(text, span);
  }
}
