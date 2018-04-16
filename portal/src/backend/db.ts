import * as mysql from 'mysql2';


export function createPool() {
  return mysql.createPool({
    host:     process.env.YJ_ISUCON_DB_HOST || 'localhost',
    user:     process.env.YJ_ISUCON_DB_USER || 'root',
    password: process.env.YJ_ISUCON_DB_PASSWORD || '',
    port:     process.env.YJ_ISUCON_DB_PORT || '3306',
    database: process.env.YJ_ISUCON_DB_NAME || 'isucon',
    connectionLimit: 10
  });
}


// Our API for demos only
export const fakeDataBase = {
  get() {
    let res = { data: 'This fake data came from the db on the server.' };
    return Promise.resolve(res);
  }
};

export const fakeTeamListDataBase = {
  teams: [
    { id: 1, name: 'オツベル', members: [ 'shokada', 'zzheng', 'kmurate' ] },
    { id: 2, name: 'ワイハリマ', members: [ 'knishiya', 'tyabuki', 'kishikir' ] },
    { id: 3, name: 'ﾜｲﾊﾘﾏ', members: [ 'hnarukaw', 'yharima' ] },
    { id: 4, name: 'SWAT Delta', members: [ 'fkarasaw', 'mtaguchi' ] },
    { id: 5, name: 'さたけ', members: [ 'dkuriyam', 'ksuda', 'mishizaw' ] },
    { id: 6, name: 'SWAT Whiskey', members: [ 'yutamura', 'tgotou', 'yusukato' ] },
    { id: 7, name: 'SWAT kilo', members: [ 'kkarino' ] },
    { id: 8, name: 'ホー( ・ᴗ・)ーホケキョ!', members: [ 'hsampei', 'tahigash', 'yuttsuts' ] },
    { id: 9, name: 'noname', members: [ 'kito' ] },
    { id: 10, name: 'おすぎ', members: [ 'stakebay', 'tsunaga' ] },
    { id: 11, name: 'std', members: [ 'tishibas', 'ksugawar', 'nshikuma' ] },
    { id: 12, name: 'りっつ', members: [ 'yuskato' ] },
    { id: 13, name: '丸ごとトマトとモッツァレラチーズのカプレーゼ', members: [ 'kkuramot' ] },
    { id: 14, name: 'SWAT Echo', members: [ 'hhirasaw' ] },
  ],

  get() {
    return Promise.resolve(this.teams);
  },

  set(team) {
    team.id = this.teams.length + 1;
    this.teams.push(team);

    return Promise.resolve(this.teams);
  }
}
