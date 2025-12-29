let database = null;
const mysql = require('mysql');
const thingDatabase = require('./thingDatabase');
const Cache = require('./Cache');
const { Schema, ParsingError } = require('./Schema');

class DatabaseObject {
	constructor(host, user, password, database) {
		this.host = host;
		this.user = user;
		this.password = password;
		this.database = database;
		this.pool = null;
		this.tables = new Map();
		this.callbacks = new Map();
		this.caches = new Map();
		this.schems = new Map();
		this.ParsingError = ParsingError;
		this.validators = {
			string: ['VARCHAR', 'TEXT', 'BLOB'],
			number: ['BIT', 'INT', 'FLOAT', 'DOUBLE'],
		};
	}

	/**
	 * Connects the database with the parameters initialized
	 */
	connect(additionalOptions = {}) {
		this.pool = mysql.createPool({
			connectionLimit: 10,
			host: this.host,
			user: this.user,
			password: this.password,
			database: this.database,
			...additionalOptions,
		});
		console.log('Database Pool Initialized!');
	}
	/**
	 * Disconnects the database but no memory cleanup
	 */
	disconnect() {
		this.pool.end(function (err) {
			console.log('Disconnected');
			// all connections in the pool have ended
		});
	}
	/**
     * @param  {String} identifier the update identifier ACTION: CREATE / GET / GETONE / COUNT / UPDATE / DELETE / Latest
          Identifiers:
            tablename-ACTION : On a Specific Table a specific Action
            *-ACTION : On Any Table a specific Action
            *-* : On any Table any Action 
     * @param  {Function} cb the callback function which gets called
     */
	setCallback(identifier, cb) {
		if (this.callbacks.has(identifier)) {
			if (Array.isArray(this.callbacks.get(identifier))) {
				this.callbacks.get(identifier).push(cb);
			} else {
				this.callbacks.set(identifier, [this.callbacks.get(identifier), cb]);
			}
		} else {
			this.callbacks.set(identifier, cb);
		}
	}
	/**
	 * @param  {String} tablename
	 * @param  {String} action
	 * @param  {Object} data
	 */
	callCallback(tablename, action, data) {
		const cbs = this.callbackToFunctions(tablename, action).filter((v) => typeof v == 'function');
		// console.log('Tried to call callback ' + cbs.join(', '));
		cbs.forEach((callback) => {
			callback({
				tablename,
				action,
				data,
			});
		});
	}
	/**
	 * @param  {String} tablename
	 * @param  {String} action
	 * Translates the tablename and action into the identifiers
	 */
	callbackToFunctions(tablename, action) {
		if (!tablename || !action) {
			return [];
		}
		const possibles = [];
		possibles.push(this.callbacks.get('*-*'));
		possibles.push(this.callbacks.get('*-' + action));
		possibles.push(this.callbacks.get(tablename + '-*'));
		possibles.push(this.callbacks.get(tablename + '-' + action));

		let output = [];
		possibles.forEach((elem) => {
			Array.isArray(elem) && (output = output.concat(elem));
			!Array.isArray(elem) && output.push(elem);
		});
		output = output.filter((v) => typeof v !== 'undefined');
		return output;
	}
	/**
	 * @typedef {Object} TableOptionsTimestamps
	 * @property {Boolean|String} [timestamps.createdAt] If bool then the timestamp is active and if string, then what this Col should be called
	 * @property {Boolean|String} [timestamps.updatedAt] If bool then the timestamp is active and if string, then what this Col should be called
	 * @property {Boolean|String} [timestamps.deletedAt] If bool then the timestamp is active and if string, then what this Col should be called
	 */
	/**
	 * @typedef {Object} TableObject
	 * @property {TableOptions=} options The table options
	 * @property {String[]} * All the columns in the table
	 */
	/**
	 * @typedef {Object} TableOptions
	 * @property {TableOptionsTimestamps|Boolean} [timestamps] The timestamps as activation bools or as naming strings or as typical bools
	 * @property {Boolean=} softdelete If the softdelete is active so the deletion never gets active and only deleted_at gets updated
	 * @property {String=} PK The Primary Key of the table
	 * @property {String|String[]} [K] The Key or the list as Keys
	 * @property {Object=} FK An Object where the key is the col name and the value the linked table/the linked col
	 */
	/**
	 * @param  {String} tablename
	 * @param  {TableObject} table
	 */
	async createTable(tablename, table) {
		const stamps = new Map([
			['createdAt', 'created_at'],
			['updatedAt', 'updated_at'],
			['deletedAt', 'deleted_at'],
		]);
		const tablecopy = JSON.parse(JSON.stringify(table));
		const options = table.options;
		delete table.options;

		if (options && options.timestamps) {
			options.timestamps = this.parseTimeStamps(options);
			stamps.forEach((value, key) => {
				if (options.timestamps[key])
					table[value] = {
						type: 'varchar(64)',
						null: false,
					};
			});
		}

		let i = 0,
			parts = '',
			max = Object.keys(table).length;
		Object.keys(table).forEach((name) => {
			i++;
			if (typeof table[name] === 'object') {
				const obj = table[name];
				let builder = obj.type + ' ' + (obj.null ? '' : 'NOT NULL');
				table[name] = builder;
			}
			parts += name + ' ' + table[name];
			if (max !== i) parts += ', ';
		});

		parts = this.parseFKandPKandK(tablename, options, parts);

		let sql = 'CREATE TABLE IF NOT EXISTS ' + tablename + ' (' + parts + ')';
		await new Promise((resolve, reject) => {
			this.pool.query(sql, (error, results, fields) => {
				if (error) reject(error);
				resolve();
			});
		});
		Object.keys(tablecopy).forEach((name) => {
			if (typeof tablecopy[name] === 'string') {
				tablecopy[name] = {
					type: tablecopy[name],
					null: false,
				};
			}
		});

		this.tables.set(tablename, { table: tablecopy, database: new thingDatabase(tablename, options, this, tablecopy) });
	}

	parseTimeStamps(options) {
		const DELETE_COLUM_NAME = 'deleted_at';
		const stamps = new Map([
			['createdAt', 'created_at'],
			['updatedAt', 'updated_at'],
		]);

		let output = {};
		const timestamps = options.timestamps;
		if (typeof timestamps === 'boolean') {
			output.createdAt = 'created_at';
			output.updatedAt = 'updated_at';
			if (options.softdelete) output.deletedAt = DELETE_COLUM_NAME;
		} else {
			stamps.forEach((value, key) => (typeof timestamps[key] === 'boolean' && timestamps[key] ? (output[key] = value) : ''));
			if (options.softdelete && typeof timestamps.deletedAt === 'boolean' && timestamps.deletedAt) {
				output.deletedAt = DELETE_COLUM_NAME;
			}
			stamps.forEach((value, key) => (typeof timestamps[key] === 'string' ? (output[key] = value) : ''));
			if (options.softdelete && typeof timestamps.deletedAt === 'string') {
				output.deletedAt = timestamps.deletedAt;
			}
		}
		return output;
	}

	parseFKandPKandK(tablename, options, parts) {
		if (options && options.PK) {
			parts += ', PRIMARY KEY (' + options.PK + ')';
		}
		if (options && options.K) {
			options.K.forEach((key) => {
				parts += ', ';
				parts += 'INDEX ' + key.toUpperCase() + ' (' + key + ')';
			});
		}
		if (options && options.FK) {
			let i = 0;
			let max = Object.keys(options.FK).length;
			parts += ', ';
			Object.keys(options.FK).forEach((name) => {
				i++;
				const table = options.FK[name].split('/')[0];
				const row = options.FK[name].split('/')[1];
				const fkname = 'FK_' + tablename + '_' + options.FK[name].replace('/', '_');
				parts += 'CONSTRAINT ' + fkname + ' FOREIGN KEY (' + name + ') REFERENCES ' + table + '(' + row + ')';
				if (max !== i) parts += ', ';
			});
		}
		return parts;
	}
	/**
	 * @param  {String} name the tablename
	 * @returns {thingDatabase} return the thing database object
	 */
	get(name) {
		if (this.tables.has(name)) return this.tables.get(name).database;
		console.log('You tried to access a Table wich is not configured yet! Deprecation Notice!');
		const newThingDatabase = new thingDatabase(name, {}, this);
		this.tables.set(name, { table: { error: 'The Table was not created from the API' }, database: newThingDatabase });
		return this.get(name);
	}

	validate(tablename, obj) {
		const table = this.tables.get(tablename).table,
			errors = [],
			options = table.options;
		delete table.options;

		if (table.error) {
			return 'Validation Error: ' + tablename + ' : ' + table.error;
		}

		Object.keys(table).forEach((name) => {
			const value = obj[name],
				definition = table[name],
				parse = definition.parse;

			//Check if exists and is required
			if (!value) {
				if (parse.required) errors.push('Missing: ' + name);
				return;
			}

			//Check if is right type
			Object.keys(this.validators).forEach((validator) => {
				if (new RegExp(this.validators[validator].join('|')).test(definition.type.toUpperCase()) && typeof value !== validator) {
					errors.push('Invalid value: ' + name + ' expected: ' + validator + '! But became: ' + typeof value);
					return;
				}
			});

			//Check if parse is matching
			if (parse) {
				if (parse.anum) {
					const regex = new RegExp(/^[a-zA-Z0-9]+$/);
					if (!regex.test(value)) {
						errors.push('Parsing Error: ' + name + ' should be alpha numerical!');
						return;
					}
				}

				let len = typeof value === 'string' ? value.length : value;
				//Check for min max parsing
				if (parse.min && parse.max) {
					if (!(len >= parse.min && len <= parse.max)) {
						errors.push('Parsing Error: ' + name + ' Parse: ' + JSON.stringify(parse));
						return;
					}
				} else if (parse.max || parse.min) {
					if (len >= parse.min || len <= parse.max) {
						errors.push('Parsing Error: ' + name + ' Parse: ' + JSON.stringify(parse));
						return;
					}
				}

				//Check For e-Mail Parsing
				if (parse.email) {
					const re =
						/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					if (!re.test(String(value).toLowerCase())) {
						errors.push('Parsing Error: ' + name + ' Expected: E-Mail');
						return;
					}
				}
			}
		});
		return errors;
	}
	/**
	 * @callback cacheDataGetCallback
	 * @param {Object[]} param - An integer.
	 */
	/**
	 * @param  {String} name the name of the cache
	 * @param  {Object} settings The cache settings policy
	 * @param  {int} settings.time The cache refresh time
	 * @param  {int} settings.calls The cache refresh calls
	 * @param {cacheDataGetCallback} cb The callback that gets hitted if the cache need to be refreshed
	 */
	registerCache(name, settings, cb) {
		this.caches.set(name, new Cache(name, settings, cb));
	}
	/**
	 * @param  {String} name gets the cache by the name
	 * @returns {Cache} returns the cache
	 */
	getCache(name) {
		return this.caches.get(name);
	}
	/**
	 * @param  {String} name the schema reference name
	 * @param  {Object} schema the schema itself
	 * @param  {String} reference_table_name the database reference_table_name not needed
	 */
	registerSchema(name, schema, reference_table_name) {
		this.schems.set(name, new Schema(name, schema, reference_table_name ? this.tables.get(reference_table_name).table : undefined));
	}
	/**
	 * @param  {String} name the schema name
	 * @returns {Schema} returns the with the name associated schema
	 */
	getSchema(name) {
		return this.schems.get(name);
	}
}
/**
 * @param  {String} host the host of the database
 * @param  {String} user the user of the database
 * @param  {String} password the password of the database
 * @param  {String} database the database in the database
 * @returns {DatabaseObject} returns the database object
 */
function createDatabase(host, user, password, database) {
	this.database = new DatabaseObject(host, user, password, database);
	return this.database;
}
/**
 * @returns {DatabaseObject} returns the database object
 */
function getDatabase() {
	return this.database;
}

module.exports = {
	createDatabase,
	getDatabase,
};
