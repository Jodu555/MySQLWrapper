const { queryPartGeneration } = require('./generationUtils');
class thingDatabase {
	constructor(table_name, options, database, connection) {
		this.table_name = table_name;
		this.options = options;
		this.database = database;
		this.connection = connection;
		console.log(this.table_name + ' Database Initialized');
	}

	create(thing) {
		const timestamps = this.options.timestamps;
		if (this.options && timestamps) {
			Object.keys(timestamps).forEach(key => {
				if (timestamps[key] !== 'deleted_at') {
					thing[timestamps[key]] = true;
				} else {
					thing[timestamps[key]] = false;
				}

			});
			if (thing.created_at) thing.created_at = Date.now()
			if (thing.updated_at) thing.updated_at = Date.now()
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
		this.connection.query(query, values, (error, results, fields) => {
			if (error) {
				throw error;
				this.database.reconnect();
				this.create(thing);
			}
		});
		return thing;
	}

	async update(search, thing) {
		if (this.options && this.options.timestamps) {
			if (this.options.timestamps.updatedAt) {
				thing.updated_at = Date.now();
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

			this.connection.query(query, values, (error, results, fields) => {
				if (error) {
					throw error;
					this.database.reconnect();
					this.update(search, thing);
				}
			});
			return await this.get(search);
		} catch (error) {
			const errormsg = `${this.name} Update Failed: searchTerm: ${JSON.stringify(
				search
			)} Update: ${JSON.stringify(thing)}  Error: ${error.message}`;
			throw new Error(errormsg);
		}
	}

	async getOne(search) {
		const result = await this.get(search);
		return result[0];
	}

	async get(search) {
		let query = 'SELECT * FROM ' + this.table_name + ' WHERE ';
		const part = queryPartGeneration(search);
		query += part.query;
		const values = part.values;

		if (Object.keys(search) == 0) {
			query = 'SELECT * FROM ' + this.table_name;
		}

		return new Promise(async (resolve, reject) => {
			await this.connection.query(query, values, async (error, results, fields) => {
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

	async delete(search) {
		if (this.options && this.options.softdelete && this.options.timestamps && this.options.timestamps.deletedAt) {
			await this.update(search, { deleted_at: Date.now() });
			return;
		}
		let query = 'DELETE FROM ' + this.table_name + ' WHERE ';
		const part = queryPartGeneration(search);
		query += part.query;
		const values = part.values;
		this.connection.query(query, values, (error, results, fields) => {
			if (error) {
				throw error;
				this.database.reconnect();
				this.delete(search);
			}
		});
	}
}

module.exports = thingDatabase;
