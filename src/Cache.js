class Cache {
    constructor(name, settings, cb) {
        this.name = name;
        ({ time: this.cacheTime, calls: this.calls } = settings);
        this.cb = cb;
        this.data = {};
        this.map = new Map();
    }

    getValueFromMapAsArrayKey(arr) {
        let retValue;
        this.map.forEach((value, key) => {
            if (this.compareArray(key, arr))
                retValue = value;
        });
        return retValue;
    }

    compareArray(arr1, arr2) {
        return arr1.length == arr2.length && JSON.stringify(arr1) == JSON.stringify(arr2);
    }
}