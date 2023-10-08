import { commands } from './commands';

function getGlobal() {
  // eslint-disable-next-line no-restricted-globals
  if (typeof self !== 'undefined') {
    // eslint-disable-next-line no-restricted-globals
    return self;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  return typeof global !== 'undefined' ? global : undefined;
}

const g = getGlobal() as any;

// The add-in command functions need to be available in global scope
commands.forEach((command) => {
  g[command.id] = command.handler;
});
