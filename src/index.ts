export { PropsDebugger } from './react-props-debugger';

// Auto-initialize function
export function initReactPropsDebugger() {
  if (process.env.NODE_ENV === 'development' || (import.meta as any).env?.DEV) {
    import('./react-props-debugger').then(({ PropsDebugger }) => {
      if (document.readyState === 'loading') {
        document.addEventListener(
          'DOMContentLoaded',
          () => new PropsDebugger()
        );
      } else {
        setTimeout(() => new PropsDebugger(), 0);
      }
    });
  }
}

// Auto-init on import
initReactPropsDebugger();
