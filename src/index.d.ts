import { PoolConfig, Pool } from 'mysql';

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
        pool: Pool;
        connect: (additionalOptions?: PoolConfig) => void;
        createTable: <T extends Table<T>>(tablename: string, table: T) => void;
        registerSchema: (name: string, schema: object, reference_table_name: string) => void;
        get: <X>(thing: string) => thingDatabase<X>;
        getSchema: (name: string) => Schema;
    }

    type SearchType = Partial<X & ?{ unique: boolean; }>;

    interface thingDatabase<X> {
        create: (thing: X) => Promise<X>;
        update: (search: SearchType, thing: Partial<X>) => Promise<void>;
        getOne: (search?: SearchType) => Promise<?X?>;
        get: (search?: SearchType) => Promise<X[]>;
        delete: (search: SearchType) => Promise<void>;
        getLatest: (action: 'inserted' | 'updated' | 'deleted', search?: Partial<X>) => Promise<?X?>;
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
