class Schema {
    constructor(schema) {
        this.options = schema.options;
        delete schema.options;
        this.schema = schema;
        this.validators = {
            string: ['VARCHAR', 'TEXT', 'BLOB'],
            number: ['BIT', 'INT', 'FLOAT', 'DOUBLE']
        }
    }

    validate(obj) {
        const errors = [];
        Object.keys(this.schema).forEach(name => {
            let value = obj[name],
                parse = this.schema[name];

            //Add Default Values
            if (parse.default && !value) {
                value = parse.default;
                obj[name] = parse.default;
            }

            //Check if exists and is required
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

        });
        return { success: errors.length == 0, errors, object: obj };
    }

}