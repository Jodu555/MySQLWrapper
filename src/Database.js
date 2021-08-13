let database = null;
const mysql = require('mysql');
const thingDatabase = require('./thingDatabase')

class DatabaseObject {

    constructor(host, user, password, database) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.database = database;
        this.connection = null;
        this.tables = new Map();
        this.validators = {
            string: ['VARCHAR', 'TEXT', 'BLOB'],
            number: ['BIT', 'INT', 'FLOAT', 'DOUBLE']
        }
    }

    connect() {
        this.connection = mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
        });
        this.connection.connect();
        this.connection.on('error', (error) => {
            console.log('Database error', error);
            if (error.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('Database connection Failed!');
                console.log('Attempting to reconnect...');
                this.reconnect();
            } else {
                throw error;
            }
        });
        console.log('Database Connected!');
    }

    disconnect() {
        if (this.connection != null) {
            this.connection.end();
            this.connection = null;
        }
    }

    reconnect() {
        this.disconnect();
        this.connect();
    }

    createTable(tablename, table) {
        const tablecopy = JSON.parse(JSON.stringify(table));
        const options = table.options;
        delete table.options;

        let i = 0, parts = '', max = Object.keys(table).length;
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

        if (options && options.PK) {
            parts += ', PRIMARY KEY (' + options.PK + ')';
        }
        if (options && options.FK) {
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
        };

        let sql = 'CREATE TABLE IF NOT EXISTS ' + tablename + ' (' + parts + ')';
        this.connection.query(sql, (error, results, fields) => {
            if (error) throw error;
        });
        Object.keys(tablecopy).forEach(name => {
            if (typeof tablecopy[name] === 'string') {
                tablecopy[name] = {
                    type: tablecopy[name],
                    null: false
                };
            };
        });
        this.tables.set(tablename, { table: tablecopy, database: new thingDatabase(tablename, this, this.connection) })
    }

    get(name) {
        if (this.tables.has(name))
            return this.tables.get(name).database;
        console.log('You tried to access a Table wich is not configured yet! Deprecation Notice!');
        return new thingDatabase(name, this, this.connection)
    }

    validate(tablename, obj) {
        const table = this.tables.get(tablename).table, errors = [], options = table.options;
        delete table.options;

        Object.keys(table).forEach(name => {
            const value = obj[name], definition = table[name], parse = definition.parse;

            //Check if exists
            if (!value) {
                errors.push('Missing: ' + name)
                return;
            }

            //Check if is right type 
            Object.keys(this.validators).forEach(validator => {
                if (new RegExp(this.validators[validator].join("|")).test(definition.type) && typeof value !== validator) {
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

}

function createDatabase(host, user, password, database) {
    this.database = new DatabaseObject(host, user, password, database);
    return this.database;
}
function getDatabase() {
    return this.database;
}

module.exports = {
    createDatabase,
    getDatabase,
};
