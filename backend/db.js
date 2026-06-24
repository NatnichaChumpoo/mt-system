// db.js - MySQL connection pool (mysql2/promise)
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

const defaultDbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "car_mt",
};

export const dbConfig = {
  host: process.env.DB_HOST || defaultDbConfig.host,
  port: Number(process.env.DB_PORT || defaultDbConfig.port),
  user: process.env.DB_USER || defaultDbConfig.user,
  password: process.env.DB_PASSWORD || defaultDbConfig.password,
  database: process.env.DB_NAME || defaultDbConfig.database,
};

export function getSafeDbConfig() {
  return {
    DB_HOST: dbConfig.host,
    DB_PORT: dbConfig.port,
    DB_USER: dbConfig.user,
    DB_NAME: dbConfig.database,
    DB_PASSWORD: dbConfig.password ? "***set***" : "***empty***",
    ENV_PATH: envPath,
  };
}

export function logDbConfig(prefix = "[db] config") {
  console.log(prefix, getSafeDbConfig());
}

export const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  dateStrings: true,
});

// Force utf8mb4 on every new connection (access underlying callback pool)
pool.pool.on("connection", (conn) => {
  conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

let dbProbePromise = null;

export async function verifyDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1 AS ok");
    return true;
  } finally {
    conn.release();
  }
}

export async function verifyDbConnectionOnce() {
  if (!dbProbePromise) {
    dbProbePromise = verifyDbConnection()
      .then((ok) => {
        console.log("[db] connectivity check passed");
        return ok;
      })
      .catch((error) => {
        console.error("[db] connectivity check failed", getSafeDbConfig());
        console.error("[db] mysql error:", error.message);
        throw error;
      });
  }
  return dbProbePromise;
}

logDbConfig();

export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
