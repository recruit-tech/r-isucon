const mysql = require('mysql')
const { promisify } = require("util");
const db = mysql.createPool({
  host: process.env.RISUCON_DB_HOST || "localhost",
  port: process.env.RISUCON_DB_PORT || 3306,
  user: process.env.RISUCON_DB_USER || "root",
  password: process.env.RISUCON_DB_PASSWORD,
  database: process.env.RISUCON_DB_NAME || "risukai",
  charset: "utf8mb4"
});

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  try {
    await connection.beginTransaction();
    // all users 一応ランダム化しておく
    const users = await query( "SELECT username FROM users LIMIT 1000" );
    const usernames = users.map((user) => user.username)
    const orgs = await query( "SELECT * FROM organizations" );
    const organizationCount = (Math.random() * orgs.length);
    let insert = `insert belongs_organizations (organization_id, username) values `
    const results = []
    for (user of usernames) {
      if (user === 'scott') {
        continue;
      }
      shuffle(orgs)
      const belongs = orgs.slice(0, organizationCount)
      for (b of belongs) {
        results.push(`(${b.id}, "${user}")`)
      }

    }
    insert += results.join(", ")
    console.log(insert);
    await query(insert);

    await connection.commit();
  } catch (e) {
    console.log('error')
    console.error(e.message);
  } finally {
    await connection.release();
  }
}

async function all(){
await main();
    process.exit(0);
}
all();
