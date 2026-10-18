// Short-lived, per-user memory cache. Failed requests are never cached.
export function createRequestCache(ttl = 15000, now = Date.now) {
  const entries = new Map();
  return {
    get(key, load) {
      const cached = entries.get(key);
      if (cached && cached.expires > now()) return cached.promise;
      const entry = { expires: Infinity };
      entry.promise = Promise.resolve().then(load).then((value) => {
        entry.expires = now() + ttl;
        return value;
      }).catch((error) => {
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
      entries.set(key, entry);
      return entry.promise;
    },
    invalidate(key) { entries.delete(key); },
  };
}
