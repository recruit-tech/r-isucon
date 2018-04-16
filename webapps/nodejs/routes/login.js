"use strict";

const express = require("express");
const { promisify } = require("util");
const router = express.Router();
const argon2 = require("argon2");
const uuid = require("uuid/v4");

router.get("/", (req, res, next) => {
  res.render("login", { title: "りすこん", message: null });
});

router.post("/", async (req, res, next) => {
  const { username, password } = req.body;
  const app = require("../app");
  const db = app.get("db");
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  const result = { message: null };
  try {
    await connection.beginTransaction();
    const users = await query("SELECT * FROM users WHERE username=?", [
      username
    ]);
    const user = users[0];
    if (!user) {
      result.message = "ユーザ名もしくはパスワードが間違っています。";
      res.status(400);
      res.render("login", result);
      return;
    }
    const verified = await argon2.verify(user.hash, user.salt + password);
    if (!verified) {
      result.message = "ユーザ名もしくはパスワードが間違っています。";
      res.status(400);
      res.render("login", result);
      return;
    }

    const sessionId = uuid();
    await query(
      "INSERT INTO session (id, username, expired_at) VALUES (?, ?, ?) on duplicate key update username=?",
      [sessionId, username, Date.now() / 1000 + 300, username]
    );
    await connection.commit();
    res.cookie("session_id", sessionId);
    res.redirect("/");
  } catch (e) {
    console.error(e);
    await connection.rollback();
    result.message = "エラーが発生しました。";
    res.status(500);
    res.render("login", result);
  } finally {
    await connection.release();
  }
});

module.exports = router;
