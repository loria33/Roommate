import { Pool } from "pg";
declare const pool: Pool;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export declare const hasSecondaryDb: boolean;
export declare const querySecondary: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export declare const hasWebsiteDb: boolean;
export declare const queryWebsite: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export default pool;
//# sourceMappingURL=database.d.ts.map