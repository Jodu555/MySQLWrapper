const { queryPartGeneration } = require('./generationUtils');
class thingDatabase {
	/**
	 * @constructor
	 */
	constructor(table_name, options, database) {
		this.table_name = table_name;
		this.options = options;
		this.database = database;
		this.pool = this.database.pool;
		console.log(this.table_name + ' Database Initialized');
	}
	/**
	 * @param  {Object} thing the thing you want to create
	 * @returns {Object} returns the actual inserted obect with for example a time
	 */
	create(thing) {
		if (this.options && timestamps) {
			const timestamps = this.options.timestamps;
			Object.keys(timestamps).forEach((key) => {
				if (timestamps[key] !== 'deleted_at') {
					thing[timestamps[key]] = Date.now();
				} else {
					thing[timestamps[key]] = false;
				}
			});
		}
		const len = Object.keys(thing).length;
		const values = [];
		let partsQuery = '(';
		let valueQuery = '(';
		let i = 0;
		Object.keys(thing).forEach((key) => {
			values.push(thing[key]);
			i++;
			valueQuery += '?';
			if (len != i) {
				valueQuery += ', ';
			}
			partsQuery += key;
			if (len != i) {
				partsQuery += ', ';
			}
		});
		valueQuery += ')';
		partsQuery += ')';
		let query = `INSERT INTO ${this.table_name} ${partsQuery} VALUES ${valueQuery}`;
		this.pool.query(query, values, (error, results, fields) => {
			if (error) {
				throw error;
				this.database.reconnect();
				this.create(thing);
			}
		});
		this.database.callCallback(this.table_name, 'CREATE', thing);
		return thing;
	}
	/**
	 * @param  {Object} search The search on what you want to update
	 * @param  {Object} thing The thing you want the search results to be updated with
	 */
	async update(search, thing) {
		if (this.options && this.options.timestamps) {
			if (this.options.timestamps.updatedAt) {
				thing[this.options.timestamps.updatedAt] = Date.now();
			}
		}
		try {
			if (!Object.keys(thing).length > 0) {
				throw new Error('Invalid thing update Object');
			}

			thing.update = true;

			let query = 'UPDATE ' + this.table_name + ' SET ';
			const part = queryPartGeneration(thing);
			query += part.query;
			const parts = queryPartGeneration(search);
			query += ' WHERE ' + parts.query;

			const values = part.values.concat(parts.values);

			this.pool.query(query, values, (error, results, fields) => {
				if (error) {
					throw error;
					this.database.reconnect();
					this.update(search, thing);
				}
			});
			this.database.callCallback(this.table_name, 'UPDATE', { search, thing });
			return await this.get(search);
		} catch (error) {
			const errormsg = `${this.name} Update Failed: searchTerm: ${JSON.stringify(search)} Update: ${JSON.stringify(thing)}  Error: ${error.message}`;
			throw new Error(errormsg);
		}
	}

	/**
	 * @param  {Object} search the search wich element you want to get
	 * @returns {Object} the object you want to get if found
	 */
	async getOne(search) {
		const result = await this.get(search);
		this.database.callCallback(this.table_name, 'GETONE', search);
		return result[0];
	}
	/**
	 * @param  {Object} search the search wich elements you want to get
	 * @returns {Object[]} an array of objects that are found to the search
	 */
	async get(search) {
		let query = 'SELECT * FROM ' + this.table_name;
		let values;
		if (search && Object.keys(search).length > 0) {
			query = 'SELECT * FROM ' + this.table_name + ' WHERE ';
			const part = queryPartGeneration(search);
			query += part.query;
			values = part.values;
		}
		this.database.callCallback(this.table_name, 'GET', search);
		return new Promise(async (resolve, reject) => {
			await this.pool.query(query, values, async (error, results, fields) => {
				const data = [];
				if (error) {
					throw error;
					this.database.reconnect();
					this.get(search);
				}
				await results.forEach((result) => {
					data.push(result);
				});
				resolve(data);
			});
		});
	}
	/**
	 * @param  {Object} search the search wich element you want to delete
	 */
	async delete(search) {
		if (this.options && this.options.softdelete && this.options.timestamps && this.options.timestamps.deletedAt) {
			const obj = {};
			obj[this.options.timestamps.deletedAt] = Date.now();
			await this.update(search, obj);
			return;
		}
		let query = 'DELETE FROM ' + this.table_name + ' WHERE ';
		const part = queryPartGeneration(search);
		query += part.query;
		const values = part.values;
		this.pool.query(query, values, (error, results, fields) => {
			if (error) {
				throw error;
				this.database.reconnect();
				this.delete(search);
			}
		});
		this.database.callCallback(this.table_name, 'DELETE', search);
	}
	/**
	 * @param  {String} action the latest action you wanna get can be: inserted, updated or deleted
	 * @param  {Object} search the search wich element you want to get the latet on
	 */
	async getLatest(action, search) {
		const stampsDict = new Map([
			['inserted', this.options.timestamps.createdAt],
			['updated', this.options.timestamps.updatedAt],
			['deleted', this.options.timestamps.deletedAt],
		]);
		if (stampsDict.has(action.toLowerCase())) {
			const timeRow = stampsDict.get(action.toLowerCase());
			if (timeRow) {
				let query = 'SELECT * FROM ' + this.table_name;
				let values;
				if (search) {
					query = 'SELECT * FROM ' + this.table_name + ' WHERE ';
					const part = queryPartGeneration(search);
					query += part.query;
					values = part.values;
				}
				query += ' ORDER BY ' + timeRow + ' DESC LIMIT 1';
				this.database.callCallback(this.table_name, 'LATEST', { action, search });
				return new Promise(async (resolve, reject) => {
					await this.pool.query(query, values, async (error, results, fields) => {
						if (error) throw error;
						if (results.length == 0) resolve(null);
						await results.forEach((result) => {
							resolve(result);
						});
					});
				});
			} else {
				console.log('You dont specified a timestamp in the table options for ' + action);
			}
		} else {
			console.log('The Action ' + action + 'is not defined! Use: inserted, updated or deleted');
		}
	}
}

module.exports = thingDatabase;
