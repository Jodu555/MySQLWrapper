const { Database } = require('../src/index');

const database = Database.createDatabase('localhost', 'root', '', 'test');
database.connect();

database.createTable('test', {
	options: {
		//IDEA
		timestamps: true,
		PK: 'UUID',
	},
	UUID: {
		type: 'varchar(64)',
		null: false,
	},
	settings: {
		type: 'JSON',
		null: false,
		json: true,
	},
});

(async () => {
	const obj = {
		UUID: 'test',
		settings: {
			test: 'test',
			test2: 'test2',
			test3: 'test3',
		},
	};
	//await database.get('test').create(obj);

	console.log(await database.get('test').getOne({ UUID: 'test' }));
})();
