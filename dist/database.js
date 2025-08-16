"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryWebsite = exports.hasWebsiteDb = exports.querySecondary = exports.hasSecondaryDb = exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
const query = (text, params) => pool.query(text, params);
exports.query = query;
const getClient = () => pool.connect();
exports.getClient = getClient;
// Secondary database (optional) - used for external cards
const secondaryConnectionString = process.env.POSTRGRESXX;
let secondaryPool = null;
if (secondaryConnectionString) {
    secondaryPool = new pg_1.Pool({
        connectionString: secondaryConnectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    });
}
exports.hasSecondaryDb = Boolean(secondaryPool);
const querySecondary = (text, params) => {
    if (!secondaryPool) {
        throw new Error("Secondary database not configured (POSTRGRESXX not set)");
    }
    return secondaryPool.query(text, params);
};
exports.querySecondary = querySecondary;
// Website database (optional) - used for Leads/Feature Requests/Language Requests
const websiteConnectionString = process.env.DATABASE_WEBSITE_URL;
let websitePool = null;
if (websiteConnectionString) {
    websitePool = new pg_1.Pool({
        connectionString: websiteConnectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    });
}
exports.hasWebsiteDb = Boolean(websitePool);
const queryWebsite = (text, params) => {
    if (!websitePool) {
        throw new Error("Website database not configured (DATABASE_WEBSITE_URL not set)");
    }
    return websitePool.query(text, params);
};
exports.queryWebsite = queryWebsite;
// Room Status Table Creation - Removed as table already exists
exports.default = pool;
//# sourceMappingURL=database.js.map