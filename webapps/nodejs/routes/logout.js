"use strict";

const express = require("express");
const { promisify } = require("util");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const sessionId = req.cookies.session_id;
  try {
    if (!sessionId) {
      res.redirect("/");
      return;
    }
    await query("DELETE FROM session WHERE id=?", [sessionId]);
    res.clearCookie("session_id");
    res.redirect("/");
  } catch (e) {
    res.redirect("/");
  }
});

module.exports = router;
