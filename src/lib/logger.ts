export const logger = {
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error('[ERROR]', ...args);
    }
  }
};
