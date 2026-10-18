// Subscribers share one session connection; route changes reuse the same snapshot.
export function createSharedStore(initial, connect) {
  let snapshot = initial;
  let disconnect;
  const listeners = new Set();
  const update = (patch) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      if (!disconnect) disconnect = connect(update);
      return () => {
        listeners.delete(listener);
        // Keep the connection during React StrictMode's immediate re-subscribe.
        queueMicrotask(() => {
          if (!listeners.size && disconnect) {
            disconnect();
            disconnect = undefined;
            snapshot = initial;
          }
        });
      };
    },
  };
}
