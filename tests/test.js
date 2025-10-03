// require('./test1');
// return;
require('./test2');
return;

const { Database } = require('../src/index');

const database = Database.createDatabase('localhost', 'root', '', 'test');
database.connect();

const create_UUID = () => {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
	return uuid;
};

generateID = (len) => {
	const poss = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
	let id = '';
	for (let i = 0; i < len; i++) {
		id += poss[Math.floor(Math.random() * poss.length)];
	}
	return id;
};

const parseID = (val) => {
	return { success: val.startsWith('==') && val.endsWith('0==='), errorMessage: 'The ID dont passes our system!' };
};

// //Default naming: createdAt: created_at | updatedAt: updated_at
database.createTable('users', {
	options: {
		//IDEA
		timestamps: true,
		PK: 'UUID',
		//Indexes: that a non primaty key should be created on that table
		K: ['username', 'password'],
	},
	UUID: {
		type: 'varchar(64)',
		null: false,
	},
	username: {
		type: 'varchar(64)',
		null: false,
	},
	email: {
		type: 'varchar(64)',
		null: false,
	},
	password: {
		type: 'varchar(64)',
		null: false,
	},
});

const registerSchema = {
	options: {
		xor: ['username/email'],
		even: ['password/repeatPassword'],
		removeOthers: true, // This will disable theauto remove of all other values
	},
	UUID: {
		value: create_UUID,
	},
	username: {
		anum: false,
		min: 5, //Included
		max: 25, //Included
		default: 'Anonymous',
	},
	ID: {
		required: true,
		//TODO: Accept also an array of parse function for parse
		parse: (val) => {
			return { success: val.startsWith('==') && val.endsWith('0==='), errorMessage: 'The ID dont passes our system!' };
		},
	},
	email: {
		email: true,
	},
	password: {
		min: 3,
	},
	repeatPassword: {},
	fixedValue: {
		value: '1231231',
	},
	generatedFixedValue: {
		value: generateID(6),
	},
	state: {
		required: true,
		enum: ['activating', 'active', 'inactive'],
	},
};

const loginSchema = {
	username: {
		anum: false,
		min: 5, //Included
		max: 25, //Included
		default: 'Anonymous',
	},
	email: {
		email: true,
	},
	password: {
		min: 3,
	},
};

const testschema = {
	numi: {
		type: 'INT',
		required: true,
		min: 0,
		max: 999,
	},
};

(async () => {
	try {
		// const user = { username: 'Jodu555', email: 'editfusee@gmail.com', hack: '121212', ID: '==676760===', password: 'dsdsdsdsdsds', repeatPassword: 'dsdsdsdsdsds', state: 'activating' };
		// database.registerSchema('registerSchema', registerSchema, 'users');
		// database.registerSchema('loginSchema', loginSchema, 'users');

		database.registerSchema('test', testschema);

		console.log(
			database.getSchema('test').validate(
				{
					numi: '1',
				},
				false
			)
		);

		// const data = database.getSchema('registerSchema').validate(user, false)

		// let validation = database.getSchema('registerSchema').validate(user, true); // true so it throws an error
		// if (validation.success) {
		//     console.log('Passed: ', validation.object);
		// } else {
		//     console.log(validation.errors);
		// }

		// validation = database.getSchema('loginSchema').validate({ username: 'Jodu555', email: 'editfusee@gmail.com', password: 'dsdsdsdsdsds' }, true); // true so it throws an error
		// if (validation.success) {
		//     console.log('Passed: ', validation.object);
		// } else {
		//     console.log(validation.errors);
		// }
	} catch (error) {
		if (error instanceof database.ParsingError) {
			console.log('Parsing Error: ' + error.message);
			//Do whatever you want
		} else {
			console.log(error);
		}
	}
	// console.log(database.tables.get('users'));

	function registerSchemaDir(name, object) {
		schems.set(name, object);
		console.log('Registered Schema for ' + name);
		// if (!(name && object)) {
		//     object = name;
		//     const re = /registerSchema\(\S.*\)(?! \{)/g
		//     const match = arguments.callee.caller.toString().match(re);
		//     for (const value of match) {
		//         innerName = value.split('(')[1].split(')')[0];
		//         if (!innerName.includes(',') && !schems.get(innerName)) {
		//             name = innerName
		//             break;
		//         }
		//     }
		// }
	}

	const obj = {
		username: 'Jodu555',
		password: 'asasasasas',
	};

	Object.defineProperty(obj, 'UUID', {
		value: 'axaxaxaxaxaxaxax',
		writable: false,
		enumerable: false,
		configurable: false,
	});

	// console.log(obj, obj.UUID);

	// console.log(obj);

	// obj.UUID = 'xdxdxdxd';
	// console.log(obj);

	// setInterval(async () => {
	//     const user = await database.get('users').getLatest('updated');
	//     console.log(user);
	// }, 5000);

	// const user = await database.get('users')
	// const user = await database.get('users').getLatest('updated');
	// const user = await database.get('users').getLatest('deleted');
	// const user = await database.get('users').getLatestInserted({ UUID: 'test' });
	// const user2 = await database.get('users').getLatest({ UUID: 'test' });
})();
