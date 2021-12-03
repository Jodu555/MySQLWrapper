class Cache {
    constructor(name, settings, cb) {
        this.name = name;
        this.refreshPending = false;
        ({ time: this.cacheTime, calls: this.calls } = settings);
        this.calls = this.calls || Infinity;
        this.cb = cb;
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

    refresh(...params) {
        if ([...params].length > 0) {
            let data = this.getValueFromMapAsArrayKey(params) || { refreshPending: false };
            data = { ...data, refreshPending: true };
            this.map.set(params, data);
        } else {
            this.refreshPending = true;
        }
    }

    async get(...params) {
        // console.log('Params', params);
        let returnObject = {};
        let data = this.getValueFromMapAsArrayKey(params) || { refreshPending: false };
        if (this.refreshPending || data.refreshPending) {
            const result = await this.cb(...params);
            data = { ...data, data: result, calls: 1, refreshPending: false };
            returnObject = { ...returnObject, ...data, cached: false }
            this.refreshPending = false;
        }
        if (this.calls && !data.cached) {
            if (data && (data.calls <= this.calls)) {
                //Persist
                data.calls++;
                if (returnObject && returnObject.cached != undefined) {
                    returnObject = { ...returnObject, ...data, cached: false };
                } else {
                    returnObject = { ...returnObject, ...data, cached: true };
                }
            } else {
                //Change
                //This only has a invertion cause it is the first one in the row
                if (!returnObject.cached) {
                    const result = await this.cb(...params);
                    data = { ...data, data: result, calls: 1 };
                    returnObject = { ...returnObject, ...data, cached: false }
                }
            }
        }
        if (this.cacheTime && !data.cached) {
            if (data && (data.cacheTime >= Date.now())) {
                //Persist
                if (returnObject && !returnObject.cached) {
                    returnObject = { ...returnObject, ...data, cached: false };
                } else {
                    returnObject = { ...returnObject, ...data, cached: true };
                }

            } else {
                //Change
                if (returnObject.cached) {
                    const result = await this.cb(...params);
                    data = { ...data, data: result, cacheTime: Date.now() + this.cacheTime };
                    returnObject = { ...returnObject, ...data, cached: false };
                } else {
                    data = { ...data, cacheTime: Date.now() + this.cacheTime };
                    returnObject = { ...returnObject, ...data, cached: false };
                }

            }
        }

        this.map.set(params, data);

        return returnObject;
    }
}

module.exports = Cache;