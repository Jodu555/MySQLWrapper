

const Database = require("./Database");

const db = Database.createDatabase('localhost', 'root', '', 'test');

db.connect();

db.createTable('testtable', {
    'UUID': 'varchar(64)',
    'text': 'TEXT'
})

db.get('testtable').create({
    UUID: 'GREETINGS',
    text: 'from the nice application!'
});

console.log(db.validate('testtable', { UUID: 'dsdsd', text: 'from the nice application!' }));
// console.log(require("./Database").getDatabase());



