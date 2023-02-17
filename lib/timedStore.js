export default class TimedStore {
  constructor(ttl) {
    this.ttl = ttl;
    this.cache = new Map();
  }

  get(key, cb) {
    cb(null, this.cache.get(key)?.value);
  }

  set(key, value, cb) {
    this.cache.set(key, { value, expires: Date.now() + this.ttl });
    for (const [k, v] of this.cache) {
      if (v.expires < Date.now()) this.cache.delete(k);
    };
    cb();
  }

  destroy(key, cb) {
    this.cache.delete(key);
    cb();
  }
}