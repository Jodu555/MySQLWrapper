const { Database } = require('../src/index');

const database = Database.createDatabase('localhost', 'root', '', 'test');
database.connect();

(async () => {
	const result = await database.createTable('test', {
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
	return;
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
