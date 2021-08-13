# MySQLWrapper
An NodeJS mysql wrapper to convert objects to the full query String! Nice to simplify the work with MySQL in a Node Enviroment

## Features

  * Handling Database connection
  * Create Tables with all around like PK or FK
  * Create Database Entrys
  * Update Database Entrys
  * Delete Database Entrys

## Usage

### Establish a connection & Create a Table 

```javascript
const { Database } = require('@jodu555/mysqlapi');

const database = Database.createDatabase('host', 'username', 'password', 'database');
database.connect();

database.createTable('users', {
    options: {
        PK: 'UUID'
    },
    'columName': {
        type: 'columType',
        null: false,
    },
});
```

### Work with the database in other classes | PUT this before you all over before you acces the database

```javascript
const { Database } = require('@jodu555/mysqlapi');
const database = Database.getDatabase();
database. //some other function like get('tablename')
```

### Create an Entry in a Table 

```javascript
database.get('tablename').create({
    columName: 'columValue'.
});
```

### Get one or more Entry/s from a Table 

```javascript
//Returns one row
database.get('tablename').getOne({
    searchColumName: 'searchColumValue',
});

//Returns an Array of rows
database.get('tablename').get({
    searchColumName: 'searchColumValue',
});
```

### Update or Delete an Entry from a Table 

```javascript
//Returns the updated row
const update = await database.get('tablename').update({
        searchColumName: 'searchColumValue'
    }, {
        updateColumName: 'updateColumValue',
    });

await database.get('tablename').delete({
        searchColumName: 'searchColumValue'
    });
```

## Todos

* [ ] Validate if the Validation works just fine
* [ ] Add the Validation to the documentation



### This Package is not finished yet. Please dont use in production environments