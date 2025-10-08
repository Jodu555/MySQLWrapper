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
        json?: Boolean;
    }

    type Table<T extends object> = { options?: TableOptions; } & { [K in keyof T]: K extends 'options' ? TableOptions : TypeOptions | string };

    interface Database {
        pool: Pool;
        connect: (additionalOptions?: PoolConfig) => void;
        createTable: <T extends Table<T>>(tablename: string, table: T) => void;
        registerSchema: (name: string, schema: object, reference_table_name: string) => void;
        get: <C, G = C>(thing: string) => thingDatabase<C, G>;
        getSchema: (name: string) => Schema;
    }


    type Prettify<T> = {
        [K in keyof T]: T[K];
    } & {};

    type SearchType<X> = Partial<X & { unique?: boolean; }>;
    interface thingDatabase<C, G = C> {
        create: (thing: C) => Promise<G>;
        update: (search: SearchType<C>, thing: Partial<C>) => Promise<void>;
        getOne: (search?: SearchType<C>) => Promise<G | null>;
        get: (search?: SearchType<C>) => Promise<G[]>;
        delete: (search: SearchType<C>) => Promise<void>;
        getLatest: (action: 'inserted' | 'updated' | 'deleted', search?: Partial<C>) => Promise<G | null>;
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
