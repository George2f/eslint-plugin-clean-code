export function splitWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[_\-\s$]+/)
    .filter(Boolean)
    .map(word => word.toLowerCase());
}

export function isConstantName(name: string): boolean {
  return name.length > 1 && /^[A-Z][A-Z0-9_]*$/.test(name);
}

export function containsWord(name: string, words: readonly string[]): boolean {
  const parts = splitWords(name);
  return words.some(word => parts.includes(word.toLowerCase()));
}
