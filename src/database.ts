import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

// Secondary database (optional) - used for external cards
const secondaryConnectionString = process.env.POSTRGRESXX;
let secondaryPool: Pool | null = null;

if (secondaryConnectionString) {
  secondaryPool = new Pool({
    connectionString: secondaryConnectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export const hasSecondaryDb = Boolean(secondaryPool);

export const querySecondary = (text: string, params?: any[]) => {
  if (!secondaryPool) {
    throw new Error("Secondary database not configured (POSTRGRESXX not set)");
  }
  return secondaryPool.query(text, params);
};

// Website database (optional) - used for Leads/Feature Requests/Language Requests
const websiteConnectionString = process.env.DATABASE_WEBSITE_URL;
let websitePool: Pool | null = null;

if (websiteConnectionString) {
  websitePool = new Pool({
    connectionString: websiteConnectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export const hasWebsiteDb = Boolean(websitePool);

export const queryWebsite = (text: string, params?: any[]) => {
  if (!websitePool) {
    throw new Error(
      "Website database not configured (DATABASE_WEBSITE_URL not set)"
    );
  }
  return websitePool.query(text, params);
};

// Room Status Table Creation - Removed as table already exists

export default pool;
