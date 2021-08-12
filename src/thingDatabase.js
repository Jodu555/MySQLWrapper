const { queryPartGeneration, removeKeyFromObject } = require('./utils');
class thingDatabase {
	constructor(table_name, database, connection) {
		this.table_name = table_name;
		this.database = database;
		this.connection = connection;
		console.log(this.table_name + ' Database Initialized');
	}

	create(thing) {
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
	}

	async update(search, thing) {
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
