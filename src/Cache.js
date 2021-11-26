class Cache {
    constructor(name, settings, cb) {
        this.name = name;
        ({ time: this.cacheTime, calls: this.calls } = settings);
        this.cb = cb;
        this.data = {};
        this.map = new Map();
    }
}