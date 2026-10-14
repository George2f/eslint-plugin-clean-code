declare module 'espree' {
  interface ParseOptions {
    ecmaVersion?: number | 'latest';
    sourceType?: 'script' | 'module' | 'commonjs';
    comment?: boolean;
    loc?: boolean;
    range?: boolean;
    tokens?: boolean;
    ecmaFeatures?: Record<string, boolean>;
  }

  export function parse(code: string, options?: ParseOptions): unknown;
  export function tokenize(code: string, options?: ParseOptions): unknown;

  const espree: {
    parse: typeof parse;
    tokenize: typeof tokenize;
  };

  export default espree;
}
