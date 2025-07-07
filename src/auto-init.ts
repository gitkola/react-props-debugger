// src/auto-init.ts
import { PropsDebugger } from './react-props-debugger';

// Auto-initialize in development
const isDev =
  typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : false;

if (isDev && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PropsDebugger());
  } else {
    setTimeout(() => new PropsDebugger(), 0);
  }
}
