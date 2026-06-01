// Utility to find and highlight chords in DOM elements

import { transposeChord } from './chordTransposer';

// Pattern to match chords with word boundaries (single # or b only)
// Use lookahead instead of \b at end since # is not a word character
const CHORD_PATTERN = /\b([A-G](?:[#b])?(?:m(?:aj)?(?:7|9|11|13)?|min|dim|aug|sus[24]|add\d|7(?:b\d|#\d)?|maj\d?)?)(?:\/[A-G](?:[#b])?)?(?=\s|$|[^\w#])/g;

// Configurable ignore rules
export const ignoreConfig = {
  containerClasses: ['NC05z'] // Classes of containers to ignore
};

/**
 * Check if an element should be skipped based on ignore rules
 * @param element - Element to check
 * @returns true if element should be ignored
 */
function shouldIgnoreElement(element: Element): boolean {
  // Check if element or any parent has an ignored class
  let current: Element | null = element;
  while (current) {
    for (const className of ignoreConfig.containerClasses) {
      if (current.classList.contains(className)) {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * Add a class to the ignore list
 * @param className - Class name to ignore
 */
export function addIgnoreClass(className: string): void {
  if (!ignoreConfig.containerClasses.includes(className)) {
    ignoreConfig.containerClasses.push(className);
  }
}

/**
 * Remove a class from the ignore list
 * @param className - Class name to stop ignoring
 */
export function removeIgnoreClass(className: string): void {
  ignoreConfig.containerClasses = ignoreConfig.containerClasses.filter(c => c !== className);
}

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
    if (parent && !SKIP_TAGS.has(parent.tagName) && !shouldIgnoreElement(parent)) {
      if (transposeTextNode(textNode, semitones)) {
        modifiedCount++;
      }
    }
  }

  return modifiedCount;
}

/**
 * Find chords in an element in the order they appear on the page
 * @param element - DOM element to search
 * @returns Ordered list of chords found, including duplicates
 */
export function findChordsInElement(element: Element): string[] {
  const chords: string[] = [];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node;
  while ((node = walker.nextNode())) {
    const parent = (node as Text).parentElement;
    if (parent && !SKIP_TAGS.has(parent.tagName) && !shouldIgnoreElement(parent)) {
      const text = (node as Text).textContent || '';
      const matches = text.match(CHORD_PATTERN);
      if (matches) {
        chords.push(...matches);
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
    if (parent && !SKIP_TAGS.has(parent.tagName) && !shouldIgnoreElement(parent)) {
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
