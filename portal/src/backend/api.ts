// Our API for demos only
import * as db from './db';
import {fakeDemoRedisCache} from './cache';
import {postTeamSchema, postLoginSchema, postQueueSchema, updateTeamSchema} from './jsonschema';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/last';
import * as express from 'express';
import * as expressJsonSchema from 'express-jsonschema';
import * as jwt from 'jsonwebtoken';
import * as expressJwt from 'express-jwt';
import * as bcrypt from 'bcrypt';
import { IConnection } from 'mysql2';
import { Subject } from 'rxjs';


export const apiRouter = express.Router();

const SECRET_KEY = process.env.YJ_ISUCON_SECRET_KEY || 'secret_key';
const pool = db.createPool();
const validateJsonSchema = expressJsonSchema.validate;
const validateJwt = expressJwt({
  secret: SECRET_KEY,
  requestProperty: 'auth',
  getToken: (req) => {
    if (req.query && req.query.access_token) {
      return req.query.access_token;
    } else if (req.body && req.body.access_token) {
      return req.body.access_token;
    }

    return null;
  }
});
const validateJwtOrPassThrough = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization === 'Yes') {
    validateJwt(req, res, next);
  } else {
    next();
  }
};

apiRouter.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const pojo = { status: 404, message: 'No Content' };
  const json = JSON.stringify(pojo, null, 2);
  res.status(404).send(json);
});

apiRouter.post('/login', validateJsonSchema({body: postLoginSchema}), (req, res) => {
  let teamId;
  let conn: IConnection;
  const sql = `SELECT id AS team_id, password FROM team WHERE name = ?`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(pool.query.bind(pool)) as any;
      return query(sql, [req.body.name]);
    })
    .mergeMap((result) => {
      return result[0].length > 0 ? result[0] : Observable.throw(new Error('Team notfound'));
    })
    .mergeMap((row: {team_id: string; password: string;}) => {
      teamId = row.team_id;
      return Observable.bindNodeCallback(bcrypt.compare)(req.body.password, row.password)
        .mergeMap((same) => { return same ? Observable.of(same) : Observable.throw(new Error('Authentication error')); });
    })
    .finally(() => { conn.release(); })
    .subscribe(
      () => {
        const access_token = jwt.sign({id: teamId}, SECRET_KEY, { expiresIn: '1d' });
        res.status(201).json({
          access_token,
          team_id: teamId,
          team_name: req.body.name
        });
      }, (err) => {
        res.status(401).json(err);
      });
});


/**
 * スコアAPI
 * GET /scores 全チームのスコア(推移)情報
 * GET /scores/:team_id 指定チームのスコア情報
 */
apiRouter.get('/scores', (req, res) => {
  let conn;
  const sql = `SELECT queue.team_id AS team_id, team.name AS team_name, score.id AS score_id,
  score.score AS score_score, score.message AS score_message, score.date AS score_date FROM score
  INNER JOIN queue ON score.queue_id = queue.id INNER JOIN team ON team.id = queue.team_id ORDER BY score.date DESC`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sql);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; score_id: number; score_score: number; score_message: string; score_date: string}) => {
      let index = acc.findIndex((elm) => { return elm.id === row.team_id; });
      if (index > -1) {
        acc[index].scores.push({id: row.score_id, score: row.score_score, message: row.score_message, date: row.score_date });
      } else {
        acc.push({id: row.team_id, name: row.team_name,
          scores: [{id: row.score_id, score: row.score_score, message: row.score_message, date: row.score_date }]});
      }

      return acc;
    }, [])
    .last()
    .finally(() => { conn ? conn.release() : null; })
    .subscribe(
      (json) => {
        res.json(json.sort((a, b) => a.id - b.id));
      }, (err) => {
        let code = 500, json = [];
        if (err.name === 'EmptyError') {
          code = 200;
        }

        res.status(code).json(json);
      });
});

apiRouter.get('/scores/:team_id', (req, res) => {
  let id = parseInt(req.params.team_id, 10);

  let conn;
  const sql = `SELECT score.id AS score_id, score.score AS score_score, score.message AS score_message, score.date AS score_date FROM score
  INNER JOIN queue ON score.queue_id = queue.id where queue.team_id = ? ORDER BY score.date DESC`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sql, [id]);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {score_id: number; score_score: number; score_message: string; score_date: string}) => {
      acc.push({id: row.score_id, score: row.score_score, message: row.score_message, date: row.score_date });
      return acc;
    }, [])
    .last()
    .finally(() => { conn ? conn.release() : null; })
    .subscribe(
      (json) => {
        res.json(json);
      }, (err) => {
        let code = 500, json = [];
        if (err.name === 'EmptyError') {
          code = 200;
        }

        res.status(code).json(json);
    });
});


/**
 * チーム情報API
 * GET /teams 全チームの情報
 * GET /teams/:team_id 指定チームの情報
 * POST /teams 新規チーム登録
 * POST /teams/:team_id チーム情報更新
 */
apiRouter.get('/teams', (req, res) => {
  let conn: IConnection;
  const sql = `SELECT team.id AS team_id, team.name AS team_name, user.name AS user_name FROM team
  INNER JOIN user ON team.id = user.team_id`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sql);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; user_name: string}) => {
      let index = acc.findIndex((elm) => { return elm.id === row.team_id; });
      if (index > -1) {
        acc[index].members.push(row.user_name);
      } else {
        acc.push({id: row.team_id, name: row.team_name, members: [row.user_name]});
      }
      return acc;
    }, [])
    .last()
    .finally(() => { conn.release(); })
    .subscribe(
    (json) => {
      res.json(json);
    }, (err) => {
      console.log(err);
    });
});

apiRouter.get('/teams/:team_id', validateJwtOrPassThrough, (req: express.Request & {auth: any}, res) => {
  let id = parseInt(req.params.team_id, 10);

  let conn;
  const sql = `SELECT team.id AS team_id, team.name AS team_name, user.name AS user_name FROM team
  INNER JOIN user ON team.id = user.team_id where team.id = ?`;
  const sqlVerified = `SELECT team.id AS team_id, team.name AS team_name, team.host AS team_host, team.lang AS team_lang, user.name AS user_name FROM team
  INNER JOIN user ON team.id = user.team_id where team.id = ?`;


  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;

      if (req.auth && req.auth.id === id) {
        return query(sqlVerified, [id]);
      } else {
        return query(sql, [id]);
      }
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; team_host?: string; team_lang?: string; user_name: string}) => {
      if (typeof acc.id !== 'undefined') {
        acc.members.push(row.user_name);
      } else {
        acc = {id: row.team_id, name: row.team_name, members: [row.user_name]};

        if (row.team_host) {
          acc.host = row.team_host;
          acc.lang = row.team_lang;
        }
      }
      return acc;
    }, {})
    .last()
    .finally(() => { conn ? conn.release() : null; })
    .subscribe(
      (json) => {
      res.json(json);
    }, (err) => {
      console.log(err);
    });
});
apiRouter.post('/teams', validateJsonSchema({body: postTeamSchema}), (req, res) => {
  let conn: IConnection;
  const sqlInsertTeam = `INSERT INTO team (name, password, best_score, host) SELECT * FROM (SELECT ?, ?, 0, ?) AS tmp
  WHERE NOT EXISTS (SELECT * FROM team WHERE name = ?) LIMIT 1`;
  const sqlInsertMember = `INSERT INTO user (team_id, name) SELECT * FROM (SELECT ?, ?) AS tmp WHERE NOT EXISTS (SELECT * FROM user WHERE name = ?) LIMIT 1`;
  const sqlSelect = `SELECT team.id AS team_id, team.name AS team_name, user.name AS user_name FROM team
  INNER JOIN user ON team.id = user.team_id`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      return Observable.bindNodeCallback(conn.beginTransaction.bind(conn))();
    })
    .mergeMap(() => {
      // salt付パスワードの生成
      return Observable.bindNodeCallback(bcrypt.hash)(req.body.password, 10);
    })
    .mergeMap((hash) => {
      let name = req.body.name;
      let host = 'example.com';

      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlInsertTeam, [name, hash, host, name]);
    })
    .mergeMap((result: {insertId: number;}) => {
      if (result.insertId === 0) {
        throw new Error('Duplicated team');
      }

      let teamId = result.insertId;
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;

      return Observable.forkJoin(...req.body.members.map((member) => { return query(sqlInsertMember, [teamId, member, member]); }));
    })
    .map((result) => {
      if (result.some((r) => {return r.insertId === 0; })) {
        throw new Error('Duplicated member');
      }
    })
    .mergeMap(() => {
      return Observable.bindNodeCallback(conn.commit.bind(conn))();
    })
    .mergeMap(() => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlSelect);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; user_name: string}) => {
      let index = acc.findIndex((elm) => { return elm.id === row.team_id; });
      if (index > -1) {
        acc[index].members.push(row.user_name);
      } else {
        acc.push({id: row.team_id, name: row.team_name, members: [row.user_name]});
      }
      return acc;
    }, [])
    .last()
    .finally(() => { conn.release(); })
    .subscribe(
      (json) => {
        res.json(json);
      },
      (err) => {
        conn.rollback(() => {});
        res.status(401).json(err);
      }
    );
});
apiRouter.post('/teams/:team_id', [validateJsonSchema({body: updateTeamSchema}), validateJwt], (req, res, next) => {
  let conn: IConnection;
  const teamId = parseInt(req.params.team_id, 10);
  const sqlUpdateTeam = `UPDATE team SET host = ?, lang = ? WHERE id = ?`;
  const sqlInsertMember = `INSERT INTO user (team_id, name) SELECT * FROM (SELECT ?, ?) AS tmp
  WHERE (SELECT COUNT(*) from user WHERE team_id = ?) < 3 AND NOT EXISTS (SELECT * FROM user WHERE name = ?) LIMIT 1`;
  const sqlSelect = `SELECT team.id AS team_id, team.name AS team_name, user.name AS user_name FROM team
  INNER JOIN user ON team.id = user.team_id`;

  if (req.auth.id !== teamId) {
    let err = new Error('Invalid team id');
    err.name = 'UnauthorizedError';
    return next(err);
  }

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      return Observable.bindNodeCallback(conn.beginTransaction.bind(conn))();
    })
    .mergeMap(() => {
      let host = req.body.host;
      let lang = req.body.lang;

      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlUpdateTeam, [host, lang, teamId]);
    })
    .mergeMap((result: {affectedRows: number;}) => {
      if (result.affectedRows === 0) {
        throw new Error('Duplicated hostname');
      }

      if (req.body.members.length > 0) {
        // TODO: refactor bindした場合の型定義の扱い
        let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;

        return Observable.forkJoin(...req.body.members.map((member) => {
          return query(sqlInsertMember, [teamId, member, teamId, member]);
        }));
      } else {
        return Observable.of([]);
      }
    })
    .map((result) => {
      if (result.length > 0 && result.some((r) => {return r.insertId === 0; })) {
        throw new Error('Duplicated member');
      }
    })
    .mergeMap(() => {
      return Observable.bindNodeCallback(conn.commit.bind(conn))();
    })
    .mergeMap(() => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlSelect);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; user_name: string}) => {
      let index = acc.findIndex((elm) => { return elm.id === row.team_id; });
      if (index > -1) {
        acc[index].members.push(row.user_name);
      } else {
        acc.push({id: row.team_id, name: row.team_name, members: [row.user_name]});
      }
      return acc;
    }, [])
    .last()
    .finally(() => { conn ? conn.release() : null; })
    .subscribe(
      (json) => {
        res.json(json);
      },
      (err) => {
        console.log(err);
        let code = 500, json;

        if (err.name === 'InvalidFlavorError') {
          code = 400;
          json = {name: err.name, message: err.message};
        } else {
          conn.rollback(() => {});
          json = {name: 'SQLError', message: 'SQLError'};
        }

        res.status(code).json(json);
      }
    );
});

/**
 * ベンチマーカー関連API
 * GET /api/benches SSEでクライアントがチェック用
 * POST /api/benches/:team_id ベンチマーカーが終了通知のために叩く
 */
const subject = new Subject();
apiRouter.get('/benches', (req: express.Request & {flush: () => void}, res) => {
  req.socket.setKeepAlive(true);
  req.socket.setTimeout(0);

  let closed = false;
  const keepAlive = Observable.interval(30 * 1000)
    .takeWhile(() => { return !closed; })
    .map(() => { return ': keep-alive\n\n'; });


  req.on('close', () => {
    closed = true;
    subject.next('event: close\n\n');
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // disable nginx proxy buffering
  });
  res.write('\n');


  subject.merge(keepAlive)
    .subscribe((message) => {
      res.write(message);

      if (!closed) {
        res.flush();
      } else {
        res.end();
      }
    });

});

apiRouter.post('/benches/:team_id', (req, res) => {
  let data: string;
  if (req.body.status === 0) {
    data = `data: {"team_id": ${req.body.team_id}, "status": "finished"} \n\n`;
  } else if (req.body.status === 2) {
    data = `data: {"team_id": ${req.body.team_id}, "status": "started"} \n\n`;
  }

  subject.next(data);
  res.json({status: 'ok'});
});

apiRouter.get('/queues', (req, res) => {
  let conn: IConnection;
  let sqlSelect = `SELECT team_id, team.name AS team_name, status FROM queue JOIN team ON queue.team_id = team.id WHERE status <> 0 ORDER BY date`;

  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap(() => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlSelect);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; status: number;}) => {
      if (row.status === 2) {
        acc.running.push(row);
      } else {
        acc.waiting.push(row);
      }
      return acc;
    }, {running: [], waiting: []})
    .last()
    .finally(() => { conn.release(); })
    .subscribe(
      (json) => {
        res.json(json);
      },
      (err) => {
        let code = 500, json = {};
        if (err.name === 'EmptyError') {
          code = 200;
          json = {running: [], waiting: []};
        }

        conn.rollback(() => {});
        res.status(code).json(json);
      }
    );
});

apiRouter.post('/queues', [validateJsonSchema({body: postQueueSchema}), validateJwt], (req, res, next) => {
  let conn: IConnection;
  let teamId = req.body.team_id;
  let sqlSelectHost = `SELECT host FROM team WHERE id = ?`;
  let sqlInsert = `INSERT INTO queue (team_id, status) VALUES (?, 0) ON DUPLICATE KEY UPDATE status = 1`;
  let sqlSelect = `SELECT team_id, team.name AS team_name, status FROM queue JOIN team ON queue.team_id = team.id WHERE status <> 0 ORDER BY date`;

  if (req.auth.id !== teamId) {
    let err = new Error('Invalid team id');
    err.name = 'UnauthorizedError';
    return next(err);
  }


  Observable.bindNodeCallback(pool.getConnection.bind(pool))()
    .do((c: IConnection) => { conn = c; })
    .mergeMap((conn: IConnection) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlSelectHost, [teamId]);
    })
    .mergeMap((result) => { return result[0]; })
    .mergeMap(() => {
      return Observable.bindNodeCallback(conn.beginTransaction.bind(conn))();
    })
    .mergeMap((hash) => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlInsert, [teamId]);
    })
    .map((result: {insertId: number; affectedRows: number;}) => {
      if (result.insertId === 0 && result.affectedRows === 0) {
        throw new Error('Upsert error');
      }
    })
    .mergeMap(() => {
      return Observable.bindNodeCallback(conn.commit.bind(conn))();
    })
    .mergeMap(() => {
      // TODO: refactor bindした場合の型定義の扱い
      let query = Observable.bindNodeCallback(conn.query.bind(conn)) as any;
      return query(sqlSelect);
    })
    .mergeMap((result) => { return result[0]; })
    .scan((acc, row: {team_id: number; team_name: string; status: number;}) => {
      if (row.status === 2) {
        acc.running.push(row);
      } else {
        acc.waiting.push(row);
      }
      return acc;
    }, {running: [], waiting: []})
    .last()
    .finally(() => { conn ? conn.release() : null; })
    .subscribe(
      (json) => {
        res.json(json);
      },
      (err) => {
        let code = 500, json;

        if (err.name === 'InvalidFlavorError') {
          code = 400;
          json = { name: err.name, message: err.message };
        } else if (err.name === 'EmptyError') {
          code = 200;
          json = {waiting: 0, order: []};
        } else {
          conn.rollback(() => {});
          json = {name: 'SQLError', message: 'SQLError'};
        }

        res.status(code).json(json);
      }
    );
});

const setupExpressJsonSchema = (err, req, res, next) => {
  if (err.name === 'JsonSchemaValidation') {
    // Log the error however you please
    // console.log(err.message);
    // logs "express-jsonschema: Invalid data found"

    // Set a bad request http response status or whatever you want
    res.status(400);

    // Format the response body however you want
    let responseData = {
      statusText: 'Bad Request',
      jsonSchemaValidation: true,
      validations: err.validations  // All of your validation information
    };

    res.json(responseData);
  } else {
    // pass error to next error middleware handler
    next(err);
  }
};

apiRouter.use(setupExpressJsonSchema);

const setupExpressJwt = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401);

    let responseData = {
      statusText: 'Unauthorized Request'
    };

    res.json(responseData);
  } else if (err.name === 'TokenExpiredError') {
    res.status(401);

    let responseData = {
      statusText: 'Bad Request'
    };

    res.json(responseData);
  } else {
    next(err);
  }
};

apiRouter.use(setupExpressJwt);

/*

// you would use cookies/token etc
var USER_ID = 'f9d98cf1-1b96-464e-8755-bcc2a5c09077'; // hardcoded as an example

// Our API for demos only
export function serverApi(req, res) {
  let key = USER_ID + '/data.json';
  let cache = fakeDemoRedisCache.get(key);
  if (cache !== undefined) {
    console.log('/data.json Cache Hit');
    return res.json(cache);
  }
  console.log('/data.json Cache Miss');

  fakeDataBase.get()
    .then(data => {
      fakeDemoRedisCache.set(key, data);
      return data;
    })
    .then(data => res.json(data));
}
*/

