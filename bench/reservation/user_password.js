const argon2 = require('argon2')
const mysql = require('mysql')
const { promisify } = require("util");
const db = mysql.createPool({
  host: process.env.RISUCON_DB_HOST || "localhost",
  port: process.env.RISUCON_DB_PORT || 3306,
  user: process.env.RISUCON_DB_USER || "root",
  password: process.env.RISUCON_DB_PASSWORD,
  database: process.env.RISUCON_DB_NAME || "risukai",
  connectionLimit: 1,
  charset: "utf8mb4"
});

const crypto = require("crypto");
const salt = length =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);

async function main() {
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  try {
    await connection.beginTransaction();
    const users = await query( "SELECT username FROM users" );
    const usernames = users.map((user) => user.username).filter((user) => user != "scott")
    for (const username of usernames) {
      const s = salt(16)
      const password = username.split("").reverse().join("")
      const hash = await argon2.hash(s + password);
      await query(`UPDATE users SET hash=?, salt=? WHERE username=?`, [hash, s, username])
    }


    await connection.commit();
  } catch (e) {
    console.error(e);
  } finally {
    await connection.release();
  }
}

async function all(){
  await main();
  process.exit(0);
}
all();
