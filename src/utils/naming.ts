const CAMEL_WORD_BOUNDARY = /([a-z0-9])([A-Z])/g;
const ACRONYM_WORD_BOUNDARY = /([A-Z]+)([A-Z][a-z])/g;
const WORD_SEPARATORS = /[_\-\s$]+/;

function insertWordBoundaries(name: string): string {
  return name.replace(CAMEL_WORD_BOUNDARY, '$1 $2').replace(ACRONYM_WORD_BOUNDARY, '$1 $2');
}

export function splitWords(name: string): string[] {
  const separated = insertWordBoundaries(name);
  const parts = separated.split(WORD_SEPARATORS);
  const words = parts.filter(Boolean);
  return words.map(word => word.toLowerCase());
}

export function isConstantName(name: string): boolean {
  return name.length > 1 && /^[A-Z][A-Z0-9_]*$/.test(name);
}

export function containsWord(name: string, words: readonly string[]): boolean {
  const parts = splitWords(name);
  return words.some(word => parts.includes(word.toLowerCase()));
}
