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

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${(
    "0" + date.getDate()
  ).slice(-2)}`;
}

const duration = [30, 60, 90, 120]
const startTime = [
'08:00', '08:30',
'09:00', '09:30',
'10:00', '10:30',
'11:00', '11:30',
'12:00', '12:30',
'13:00', '13:30',
'14:00', '14:30',
'15:00', '15:30',
'16:00', '16:30',
'17:00', '17:30',
'18:00', '18:30',
'19:00', '19:30',
'20:00', '20:30',
'21:00', '21:30',
'22:00', '22:30',
]

function addTime(time, minute) {
  const date = new Date("2001/1/1 " + time);
  date.setMinutes(date.getMinutes() + minute);
  return `${("0" + date.getHours()).slice(-2)}:${(
    "0" + date.getMinutes()
  ).slice(-2)}`;
}

async function main() {
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  try {
    await connection.beginTransaction();
    // all users 一応ランダム化しておく
    const users = await query( "SELECT username FROM users ORDER BY RAND()" );
    const usernames = users.map((user) => user.username)
    const titles = ['よもやま', 'キックオフ', '壁打ち', 'WCM面談', '面接', '打ち合わせ', '会議', '経営会議']
    const results = [];
    for (var a=0; a<5; a++) {
  let insert_base = `insert ignore reservation (room_id, username, title, date, start_time, end_time) values `
    console.time('gen strings');
    for (var i=0; i< 10000; i++) {
      const start = startTime[Math.floor(Math.random() * startTime.length)]
      const end = addTime(start, 30)
      const title = titles[Math.floor(Math.random() * titles.length)]

      results.push(`(${Math.floor(Math.random() * 100)}, "${usernames[Math.floor(Math.random() * usernames.length)]}", "${title + ' ' + i}", "${formatDate(randomDate(new Date(2017, 10, 1), new Date(2018, 2, 20)))}", "${start}", "${end}")`);
    }
    console.timeEnd('gen strings');
    const values = results.join(', ')
    insert_base += values;
    console.time('insert')
    await query(insert_base);
    console.timeEnd('insert')
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
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  await main();
  process.exit(0);
}
all();
