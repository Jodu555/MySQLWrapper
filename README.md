# MySQLWrapper
An NodeJS mysql wrapper to convert objects to the full query String! Nice to simplify the work with MySQL in a Node Enviroment

## Features

  * Handling Database connection
  * Create Tables with all around like PK or FK
  * Create Database Entrys
  * Update Database Entrys
  * Delete Database Entrys
  * Helps you on handling with timestamps
  * Provides an set of callbacks to may log the infos

## Usage

### Establish a connection & Create a Table 

```javascript
const { Database } = require('@jodu555/mysqlapi');

const database = Database.createDatabase('host', 'username', 'password', 'database');
database.connect();

database.createTable('tablename', {
    options: {
        PK: 'UUID'
    },
    'columName': {
        type: 'columType',
        null: false,
    },
});
```

### Create a Table with Foreign Keys & Indexes
#### This Means that to the colum user_UUID will created an FK to the table users in the colum UUID
### The K means that the columen name gets an index

```javascript
database.createTable('services', {
    options: {
        PK: 'UUID',
        K: [
            'name'
        ]
        FK: {
            'user_UUID': 'users/UUID',
        },
    },
    'UUID': {
        type: 'varchar(64)',
        null: false,
    },
    'user_UUID': {
        type: 'varchar(64)',
        null: false,
    },
    'name': 'varchar(64)',
});
```

### Create a Table with timestamps e.g (created_at, updated_at) and softdelete with deleted_at

```javascript
database.createTable('services', {
    options: {
        //Enables softdelete
        softdelete: true,
        //Enable all available timestamps
        timestamps: true,
        //Enable only one or two with default naming only deletedAt if softdelete is activ
        timestamps: {
            cratedAt: true,
            updatedAt: false,
            deletedAt: true
        },
        //Enable only one or two with custom colum naming only deletedAt if softdelete is activ
        timestamps: {
            cratedAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at'
        },
        PK: 'UUID',
    },
    'UUID': {
        type: 'varchar(64)',
        null: false,
    },
    'user_UUID': {
        type: 'varchar(64)',
        null: false,
    },
    'name': 'varchar(64)',
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
//Retunrs the created Entry
database.get('tablename').create({
    columName: 'columValue',
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

### Get Latest Entry by inseted / updated / deleted 

```javascript
//Returns the latest inseted / updated / deleted row

//Gets the general latest
await database.get('tablename').getLatest('inserted');
await database.get('tablename').getLatest('updated');
await database.get('tablename').getLatest('deleted');

//Gets the latest by a specific search
await database.get('tablename').getLatest('type', {
        searchColumName: 'searchColumValue'
    });

```

### Database action callback usage

```javascript
/**
 * IDENTIFIER Building:
    ACTION: CREATE / GET / GETONE / UPDATE / DELETE / LATEST
    Identifiers:
        tablename-ACTION : On a Specific Table a specific Action
        *-ACTION : On Any Table a specific Action
        *-* : On any Table any Action
*/

database.setCallback('IDENTIFIER', ({ tablename, action, data }) => {
    //Here you can log the data or do whatever you want to do
});
```

## Projects using this API

* [Monitoring-System](https://github.com/Jodu555/MonitoringSystem-Core)
* [AmazonPriceTracker](https://github.com/Jodu555/AmazonPriceTracker)
* [YouTube-ChatBot](https://github.com/Jodu555/YouTube-ChatBot)
* [Ez-Uploader](https://ez-uploader.de)

## Todos

* [x] Add possibility to createTable to auto implement the timestamps created_AT / updated_AT
* [x] Add the possibility to activate softdelete and add in the timestamps
* [x] Add the possibility to create indexes in tables
* [x] Add the possibility to set callback functions for databse actions
* [x] Add a function to get the latest one!!
* [ ] Manage the return for the action callback functions to manipulate the return
    * [ ] pre callbacks
    * [ ] post callbacks
* [ ] Add the possibility to order a get statement
* [ ] ReEngineer the validation
* [ ] Add a direct memory implemented caching system
* [ ] Validate if the Validation works just fine
* [ ] Add the Validation to the documentation



### This Package is not finished yet. Please dont use in production environments