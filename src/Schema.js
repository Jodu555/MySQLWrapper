const testSchema = {
    options: {
        xor: ['username/email'],
        even: ['password/repeatPassword'] // This assures that the password and repeatPassword have the exact same value
    },
    UUID: {
        value: () => createUUID(), // This always sets a value
    },
    username: {
        required: true, //This requires a value to be present
        anum: true, // This assures that only alpha numerical chars are allowed
        min: 5, // this specifies the minimal char length! Included
        max: 10, // this specifies the minimal char length! Included
        default: 'Anonymous' // This defaults the value if isnt present
    },
    email: {
        required: true,
        email: true // This Validates if its an email
    },
    password: {
        required: true,
        min: 3
    },
    code: {
        required: true,
        min: 1, //This specifies the minimum number! Included
        min: 999//This specifies the maximal number! Included
    },
    ID: {
        required: true,
        parse: (val) => {
            //So the id must have the format ==456870===
            return { success: val.startsWith('==') && val.endsWith('0==='), errorMessage: 'The ID dont passes our system!' };
        },
    },
    multiple: {
        required: true,
        //The Parse option can also be used with arrays for multiple functions and mutiple errors
        parse: [
            (val) => {
                return { success: yourParsing, errorMessage: 'Your Parsing error message' };
            },
            (val) => {
                return { success: yourSecondParsing, errorMessage: 'Your Second Parsing error message' };
            }
        ],
    },
    repeatPassword: {
        required: true,
        min: 3
    },
    state: {
        required: true,
        enum: ['activating', 'active', 'inactive']
    }
};

class Schema {
    constructor(name, schema, ref_table) {
        this.name = name;
        this.ref_table = JSON.parse(JSON.stringify(ref_table));
        this.options = schema.options;
        delete schema.options;
        this.schema = schema;
        this.validators = {
            string: ['VARCHAR', 'TEXT', 'BLOB'],
            number: ['BIT', 'INT', 'FLOAT', 'DOUBLE']
        }

        this.setupEven(this.schema);

        if (this.ref_table)
            this.setupForRefTable();

        // console.log(name, schema, ref_table);
    }

    setupEven(obj) {
        if (this?.options?.even && Array.isArray(this?.options?.even)) {
            this.options.even.forEach(even => {
                const [where, to] = even.split('/');
                obj[where] = { ...obj[to], ...obj[where] };
                obj[to] = { ...obj[to], ...obj[where] };
            });
        }
    }

    valueOrFunctionInvocation(param) {
        let value = null;
        if (typeof param == 'function') {
            value = param();
        } else {
            value = param;
        }
        return value;
    }

    setupForRefTable() {
        delete this.ref_table.options;

        Object.keys(this.ref_table).forEach(key => {
            if ((!this.schema[key] || this.schema[key]) && this.schema[key] && this.ref_table[key]) {
                //Type override
                if (!this.schema[key]?.type && this.ref_table[key]?.type) {
                    this.schema[key].type = this.ref_table[key].type;
                }

                //Null/Required override
                if (this.schema[key].required == undefined && this.ref_table[key].null != undefined) {
                    this.schema[key].required = !this.ref_table[key].null;
                }
            }
        });
        this.setupEven(this.ref_table);
        this.setupEven(this.schema);
    }
    /**
     * @typedef {Object} ValidationReturn
     * @property {Boolean} success Whether or not the validation was successful
     * @property {Object} object The Validated and maybe changed object
     * @property {Object[]} errors All the occured errors
     */
    /**
     * @param  {Object} obj the object that need to be validated
     * @param  {Boolean} thro an Boolen if the function should throw an exception or just return the error
     * @returns {ValidationReturn}
     */
    validate(obj, thro) {
        const errors = [];

        //Remove unknown fields
        if (this.options?.removeOthers == undefined || this.options?.removeOthers) {
            Object.keys(obj).forEach(name => {
                if (!this.schema[name])
                    delete obj[name];
            });
        }

        Object.keys(this.schema).forEach(name => {
            let value = obj[name],
                parse = this.schema[name];

            //Add Default Values
            if (parse.default && !value) {
                value = valueOrFunctionInvocation(parse.default);
                // if (typeof parse.default == 'function') {
                //     value = parse.default();
                // } else {
                //     value = parse.default;
                // }
                obj[name] = value;
            }

            //Check if there is a predefined value
            if (parse.value) {
                value = valueOrFunctionInvocation(parse.value);
                // if (typeof parse.value == 'function') {
                //     value = parse.value();
                // } else {
                //     value = parse.value;
                // }
                obj[name] = value;
            }

            //Check if exists and is required
            //TODO: Added the xor option
            if (!value) {
                if (parse.required)
                    errors.push('Missing: ' + name)
                return;
            }

            if (parse.enum && Array.isArray(parse.enum)) {
                if (!parse.enum.includes(value)) {
                    errors.push('Parsing Error: ' + name + ' can only bee ' + parse.enum.join(', ').replace(/, ([^,]*)$/, ' and $1'));
                }
            }

            //Check if is right type 
            if (parse.type)
                Object.keys(this.validators).forEach(validator => {
                    if (new RegExp(this.validators[validator].join("|")).test(parse.type.toUpperCase()) && typeof value !== validator) {
                        errors.push('Invalid value: ' + name + ' expected: ' + validator + '! But became: ' + typeof value);
                        return;
                    }
                });

            //Check if parse is matching
            if (parse) {
                //Alphanumerical Parsing
                if (parse.anum) {
                    const regex = new RegExp(/^[a-zA-Z0-9]+$/);
                    if (!regex.test(value)) {
                        errors.push('Parsing Error: ' + name + " should be alpha numerical!")
                        return;
                    }
                }

                errors.push(...this.parseMinMax(name, value, parse))

                //e-Mail Parsing
                if (parse.email) {
                    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (!re.test(String(value).toLowerCase())) {
                        errors.push('Parsing Error: ' + name + " Expected: E-Mail");
                        return;
                    }
                }

                //Check for Own Parsing Function
                if (parse.parse && (typeof parse.parse == 'function' || Array.isArray(parse.parse))) {
                    const fns = Array.isArray(parse.parse) ? [...parse.parse] : [parse.parse];

                    fns.forEach(fn => {
                        const returnValue = fn(value);
                        if (!returnValue.success)
                            errors.push(returnValue.errorMessage);
                    });
                }

            }

            if (this?.options && this?.options.even && Array.isArray(this?.options.even)) {

                //Even Parsing
                this.options.even.forEach(even => {
                    const def = even.split('/')[0],
                        should = even.split('/')[1];
                    if (def == name && obj[should] && value !== obj[should])
                        errors.push('The: \'' + name + '\' value should be equal to the \'' + should + '\' value! But isn\'t!');
                });
            }

        });
        const returnObject = {
            success: errors.length == 0,
            errors,
        }
        if (returnObject.success)
            returnObject.object = obj;

        if (thro && !returnObject.success) {
            throw new ParsingError(returnObject.errors.join(' / '));
        } else {
            return returnObject;
        }
        return returnObject;
    }

    parseMinMax(name, value, parse) {
        const errors = [];
        let len = typeof value === 'string' ? value.length : value;
        //Check for min max parsing
        if (parse.min && !(len >= parse.min)) {
            errors.push('Parsing Error: ' + name + ' Must have at least ' + parse.min + ' Characters/Numbers! It has ' + len);
        }
        if (parse.max && !(len <= parse.max)) {
            errors.push('Parsing Error: ' + name + ' Must have under ' + parse.max + ' Characters/Numbers! It has ' + len);
        }
        return errors;
    }

}

class ParsingError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { Schema, ParsingError };