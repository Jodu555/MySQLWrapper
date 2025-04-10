import { PoolConfig } from 'mysql';

declare module '@jodu555/mysqlapi' {
    interface IOverDatabase {
        createDatabase: (host: string, username: string, password: string, database: string) => Database;
        getDatabase: () => Database;
    }

    interface TableOptionsTimestamps {
        createdAt?: Boolean | String;
        updatedAt?: Boolean | String;
        deletedAt?: Boolean | String;
    }

    interface TableOptions {
        timestamps?: TableOptionsTimestamps | Boolean;
        softdelete?: Boolean;
        PK?: String;
        K?: String | String[];
        FK?: Object;
    }

    interface TypeOptions {
        type: String;
        null?: Boolean;
    }

    type Table<T extends object> = { options?: TableOptions; } & { [K in keyof T]: K extends 'options' ? TableOptions : TypeOptions | string };

    interface Database {
        connect: (additionalOptions: PoolConfig) => void;
        createTable: <T extends Table<T>>(tablename: string, table: T) => void;
        registerSchema: (name: string, schema: object, reference_table_name: string) => void;
        get: <X>(thing: string) => thingDatabase<X>;
        getSchema: (name: string) => Schema;
    }

    interface thingDatabase<X> {
        create: (thing: X) => Promise<X>;
        update: (search: Partial<X>, thing: Partial<X>) => Promise<void>;
        getOne: (search?: Partial<X>) => Promise<X>;
        get: (search?: Partial<X>) => Promise<[X]>;
        delete: (search: Partial<X>) => Promise<void>;
        getLatest: (action: 'inserted' | 'updated' | 'deleted', search?: Partial<X>) => Promise<X>;
    }

    type ValidationReturn = {
        success: Boolean;
        object: object;
        errors: Object[];
    };

    interface Schema {
        validate: (obj: object, thro: Boolean) => ValidationReturn;
    }

    export let Database: IOverDatabase;
}
