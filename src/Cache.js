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

    async get(...params) {
        console.log('Params', params);
        let returnObject;
        let data = this.getValueFromMapAsArrayKey(params) || {};
        if (this.calls) {
            if (data && (data.calls <= this.calls)) {
                //Persist
                data.calls++;
                returnObject = { ...returnObject, ...data, cached: true }
            } else {
                //Change
                const result = await this.cb(...params);
                data = { ...data, data: result, calls: 1 };
                returnObject = { ...returnObject, ...data, cached: false }
            }
        }
        if (this.cacheTime) {
            if (data && (data.cacheTime >= Date.now())) {
                //Persist
                returnObject = { ...returnObject, ...data, cached: true };
            } else {
                //Change
                const result = await this.cb(...params);
                data = { ...data, data: result, cacheTime: Date.now() + this.cacheTime };
                returnObject = { ...returnObject, ...data, cached: false };
            }
        }

        this.map.set(params, data);

        return returnObject;
    }
}

module.exports = Cache;