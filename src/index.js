const Database = require("./Database");
const db = Database.createDatabase('localhost', 'root', '', 'test');
db.connect();

db.createTable('testtable', {
    'UUID': 'varchar(64)',
    'text': 'TEXT'
});

// db.get('testtable').create({
//     UUID: 'GREETINGS',
//     text: 'from the nice application!'
// });

(async () => {
    // const one = await db.get('testtable').getOne({ UUID: 'GREETINGS' })
    // console.log('One: ', one);

    const update = await db.get('testtable').update({ UUID: 'GREETINGS' }, { text: 'from the other nice application!' });
    console.log('Update: ', update);
})();


// console.log(db.validate('testtable', { UUID: 'dsdsd', text: 'from the nice application!' }));
// console.log(require("./Database").getDatabase());



