const testSchema = {
    options: {
        xor: ['username/email'],
        even: ['password/repeatPassword']
    },
    username: {
        required: true,
        anum: true,
        min: 5, //Included
        max: 10, //Included
        default: 'Anonymous'
    },
    email: {
        required: true,
        email: true
    },
    password: {
        required: true,
        min: 3
    },
    repeatPassword: {
        required: true,
        min: 3
    }
};

class Schema {
    constructor(name, schema, ref_table) {
        this.name = name;
        this.ref_table = ref_table;
        this.options = schema.options;
        delete schema.options;
        this.schema = schema;
        this.validators = {
            string: ['VARCHAR', 'TEXT', 'BLOB'],
            number: ['BIT', 'INT', 'FLOAT', 'DOUBLE']
        }
        if (this.ref_table)
            this.setupForRefTable();

        console.log(name, schema, ref_table);
    }

    setupForRefTable() {
        delete this.ref_table.options;
        Object.keys(this.ref_table).forEach(key => {
            if ((!this.schema[key] || this.schema[key]) && this.ref_table[key]) {

                //Type override
                if (!this.schema[key].type && this.ref_table[key].type) {
                    this.schema[key].type = this.ref_table[key].type;
                }

                //Null/Required override
                if (!this.schema[key].required == undefined && this.ref_table[key].null != undefined) {
                    this.schema[key].required = !this.ref_table[key].null;
                }

            }

        });
    }

    validate(obj) {
        const errors = [];
        Object.keys(this.schema).forEach(name => {
            let value = obj[name],
                parse = this.schema[name];

            //Add Default Values
            if (parse.default && !value) {
                if (typeof parse.default == 'function') {
                    value = parse.default();
                } else {
                    value = parse.default;
                }
                obj[name] = value;
            }

            //Check if exists and is required
            //TODO: Added the xor option
            if (!value) {
                if (parse.required)
                    errors.push('Missing: ' + name)
                return;
            }

            //Check if is right type 
            if (parse.type)
                Object.keys(this.validators).forEach(validator => {
                    if (new RegExp(this.validators[validator].join("|")).test(definition.type.toUpperCase()) && typeof value !== validator) {
                        errors.push('Invalid value: ' + name + ' expected: ' + validator + '! But became: ' + typeof value);
                        return;
                    }
                });

            //Check if parse is matching
            if (parse) {
                //Check for alphanumerical
                if (parse.anum) {
                    const regex = new RegExp(/^[a-zA-Z0-9]+$/);
                    if (!regex.test(value)) {
                        errors.push('Parsing Error: ' + name + " should be alpha numerical!")
                        return;
                    }
                }

                errors.push(...this.parseMinMax(name, value, parse))

                //Check For e-Mail Parsing
                if (parse.email) {
                    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (!re.test(String(value).toLowerCase())) {
                        errors.push('Parsing Error: ' + name + " Expected: E-Mail");
                        return;
                    }
                }

                //Check if there is a own specified parse function
                if (parse.parse && typeof parse.parse == 'function') {
                    const returnValue = parse.parse(value);
                    if (!returnValue.success) {
                        errors.push(returnValue.errorMessage);
                        return;
                    }
                }

            }

            if (this.options && this.options.even && Array.isArray(this.options.even)) {

                //Even Parsing
                this.options.even.forEach(even => {
                    const def = even.split('/')[0],
                        should = even.split('/')[1];
                    if (def == name && obj[should] && value !== obj[should])
                        errors.push('The: \'' + name + '\' value should be equal to the \'' + should + '\' value!');
                });
            }

        });
        const returnObject = {
            success: errors.length == 0,
            errors,
        }
        if (returnObject.success)
            returnObject.object = obj;
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

module.exports = Schema;