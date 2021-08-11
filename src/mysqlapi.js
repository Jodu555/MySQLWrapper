const thingDatabase = require("./thingDatabase");

const validators = {
    string: ['VARCHAR', 'TEXT', 'BLOB'],
    number: ['BIT', 'INT', 'FLOAT', 'DOUBLE']
}

function validate(table, obj) {
    const errors = [];
    const options = table.options;
    delete table.options;


    Object.keys(table).forEach(name => {
        const value = obj[name];
        const definition = table[name];
        const parse = definition.parse;

        //Check if exists
        if (!value) {
            errors.push('Missing: ' + name)
            return;
        }

        //Check if is right type 
        Object.keys(validators).forEach(validator => {
            if (new RegExp(validators[validator].join("|")).test(definition.type) && typeof value !== validator) {
                errors.push('Invalid value: ' + name + ' expected: ' + validator + '! But became: ' + typeof value);
                return;
            }
        });

        //Check if parse is matching
        if (parse) {

            //Check for min max parsing
            if (parse.min || parse.max) {
                parse.min = parse.min && parse.min > 0 ? parse.min : 1
                parse.max = parse.max && parse.max >= parse.min ? parse.max : parse.min * 2;
                if (parse.min && parse.max) {
                    let len = typeof value === 'string' ? value.length : value;
                    if (!(len >= parse.min && len <= parse.max)) {
                        errors.push('Parsing Error: ' + name + " Parse: " + JSON.stringify(parse));
                        return;
                    }
                }
            }

            //Check For e-Mail Parsing
            if (parse.email) {
                const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!re.test(String(value).toLowerCase())) {
                    errors.push('Parsing Error: ' + name + " Expected: E-Mail");
                    return;
                }
            }


        }
    });
    return errors;
}

function createTable(tablename, table) {
    const tablecopy = JSON.parse(JSON.stringify(table));
    const options = table.options;
    delete table.options;

    let i = 0;
    let max = Object.keys(table).length;
    let parts = '';
    Object.keys(table).forEach(name => {
        i++;
        if (typeof table[name] === 'object') {
            const obj = table[name];
            let builder = obj.type + ' ' + (obj.null ? '' : 'NOT NULL');
            table[name] = builder;
        }
        parts += name + ' ' + table[name];
        if (max !== i) parts += ', ';
    });

    if (options.PK) {
        parts += ', PRIMARY KEY (' + options.PK + ')';
    }

    if (options.FK) {
        let i = 0;
        let max = Object.keys(options.FK).length;
        parts += ', ';
        Object.keys(options.FK).forEach(name => {
            i++;
            const table = options.FK[name].split('/')[0];
            const row = options.FK[name].split('/')[1];
            const fkname = 'FK_' + tablename + '_' + options.FK[name].replace('/', '_');
            parts += 'CONSTRAINT ' + fkname + ' FOREIGN KEY (' + name + ') REFERENCES ' + table + '(' + row + ')';
            if (max !== i) parts += ', ';

        });
    }
    let sql = 'CREATE TABLE IF NOT EXISTS ' + tablename + ' (' + parts + ')';
    queryAcceptor(sql);
    Object.keys(tablecopy).forEach(name => {
        if (typeof tablecopy[name] === 'string') {
            const obj = {
                type: tablecopy[name],
                null: false
            };
            tablecopy[name] = obj;
        }
    });
    return { table: tablecopy, database: new thingDatabase(tablename,) };
}



module.exports = {
    validate,
    createTable,
}