type BeforeCloseHandler = () => Promise<void>;

let beforeCloseHandler: BeforeCloseHandler | null = null;

export function registerBeforeWindowClose(handler: BeforeCloseHandler) {
  beforeCloseHandler = handler;
  return () => {
    if (beforeCloseHandler === handler) beforeCloseHandler = null;
  };
}

export function saveProjectBeforeWindowClose() {
  return beforeCloseHandler?.() ?? Promise.resolve();
}
