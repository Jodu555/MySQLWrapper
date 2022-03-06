const { Database } = require('../src/index');


const database = Database.getDatabase();

// database.get('dsd').

// const test1 = {
//     softdelete: true,
//     timestamps: true,
// }

// const test2 = {
//     softdelete: true,
//     timestamps: {
//         createdAt: true,
//         updatedAt: false,
//         deletedAt: true,
//     },
// }

// const test3 = {
//     timestamps: {
//         createdAt: 'created_at',
//         updatedAt: 'updated_at',
//     },
// }

// const test4 = {
//     timestamps: {
//         createdAt: 'created_at',
//         updatedAt: 'updated_at',
//     },
// }

// console.log(parse(test1));
// console.log(parse(test2));
// console.log(parse(test3));

//Enable All with default naming
// timestamps: true,
//Enable only one or two with default naming
// timestamps: {
//     cratedAt: true,
//     updatedAt: true,
// },
//Enable only one or two with custom colum naming
// timestamps: {
//     cratedAt: 'created_at',
//     updatedAt: 'updated_at',
// },

// function parse(options) {
//     const CREATE_COLUM_NAME = 'created_at';
//     const UPDATE_COLUM_NAME = 'updated_at';
//     const DELETE_COLUM_NAME = 'deleted_at';
//     let output = {};
//     const timestamps = options.timestamps;

//     const stamps = new Map([
//         ['createdAt', 'created_at'],
//         ['updatedAt', 'updated_at']
//     ]);

//     if (typeof timestamps === 'boolean') {
//         output.createdAt = CREATE_COLUM_NAME;
//         output.updatedAt = UPDATE_COLUM_NAME;
//         if (options.softdelete)
//             output.deletedAt = DELETE_COLUM_NAME;
//     } else {
//         stamps.forEach((value, key) => (typeof timestamps[key] === 'boolean' && timestamps[key]) ? output[key] = value : '');
//         if (options.softdelete && typeof timestamps.deletedAt === 'boolean' && timestamps.deletedAt) {
//             output.deletedAt = DELETE_COLUM_NAME;
//         }
//         stamps.forEach((value, key) => (typeof timestamps[key] === 'string') ? output[key] = value : '');
//         if (options.softdelete && typeof timestamps.deletedAt === 'string') {
//             output.deletedAt = timestamps.deletedAt;
//         }
//     }
//     return output;
// }

// const callbacks = new Map();

// callbacks.set('tablename-ACTION', 'test1');
// callbacks.set('test-ACTION', 'test1.1');
// callbacks.set('*-ACTION', 'test2');
// callbacks.set('*-TEDT', 'test2.1');
// callbacks.set('*-*', ['test3.1', 'test3.2']);

// console.log(
//     callCallback('tablename', 'ACTION', {}),
// );

// function callCallback(tablename, action, data) {
//     const callbacks = callbackToFunctions(tablename, action).filter(v => typeof v == 'function');
//     callbacks.forEach(callback => {
//         callback(data)
//     });
// }

// function callbackToFunctions(tablename, action) {
//     if (!tablename || !action) {
//         return [];
//     }
//     const possibles = [];
//     possibles.push(callbacks.get('*-*'));
//     possibles.push(callbacks.get('*-' + action));
//     possibles.push(callbacks.get(tablename + '-*'));
//     possibles.push(callbacks.get(tablename + '-' + action));

//     const otherArrays = [];
//     const possiblesCleaned = possibles.map(v => {
//         if (!Array.isArray(v))
//             return v;
//         otherArrays.push(v);
//         return undefined;
//     }).filter(v => typeof v !== 'undefined');
//     var merged = [].concat.apply([], otherArrays);
//     const output = merged.concat(possiblesCleaned);
//     return output;
// }

// function msToTime(duration) {
//     var milliseconds = parseInt((duration % 1000))
//         , seconds = parseInt((duration / 1000) % 60)
//         , minutes = parseInt((duration / (1000 * 60)) % 60)
//         , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

//     let output = '';
//     if (hours !== 0)
//         output += `${hours} ${hours > 1 ? 'Stunden' : 'Stunde'} `
//     if (minutes !== 0)
//         output += `${minutes} ${minutes > 1 ? 'Minuten' : 'Minute'} und `
//     if (seconds !== 0)
//         output += `${seconds} ${seconds > 1 ? 'Sekunden' : 'Sekunde'}`
//     return output;
// }

// const { Database } = require('mysqlapi');
// const database = Database.getDatabase();

// database.get('users').actions.log('from other ding')


const wait = (m) => new Promise((r, j) => setTimeout(r, m));

const cbs = [];

regCallback(async(context, next) => {
    console.log(1);
    await wait(1000)
    context.name = 'Roberto';
    next();
})

regCallback((context, next) => {
    console.log(2);
    context.name = [context.name, 'Alejandro'];
    next();
})

callCallback({}).then(console.log);


function regCallback(cb) {
    cbs.push(cb);
}

async function callCallback(data) {
    for (const x of cbs) {
        await x(data, () => {});
    }
    return data;
}