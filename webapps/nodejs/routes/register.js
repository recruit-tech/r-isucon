"use strict";

const express = require("express");
const { promisify } = require("util");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const mimes = require("mime-types");
const argon2 = require("argon2");
const uuid = require("uuid/v4");
const genRandomString = require("../utils/genRandomString");
const {
  validateOrganizations,
  validateUsername,
  validatePassword
} = require("../utils/validator");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(__dirname, "..", "..", "uploads/"));
  },
  filename(req, file, cb) {
    const ext = mimes.extension(file.mimetype);
    if (ext != "jpeg" && ext != "jpg" && ext != "png" && ext != "gif") {
      return cb(null, "default.png");
    }
    cb(
      null,
      `${req.body.username}-${Date.now()}.${uuid()}.${mimes.extension(file.mimetype)}`
    );
  }
});
const uploads = multer({ storage: storage });

router.get("/", async (req, res, next) => {
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const organizations = await query("SELECT * from organizations");
  res.render("register", { title: "りすこん", organizations, message: "" });
});

router.post("/", uploads.single("icon"), async (req, res, next) => {
  const app = require("../app");
  const db = app.get("db");
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  try {
    const {
      username,
      password,
      first_name,
      last_name,
    } = req.body;

    let organization = req.body.organization;
    if (typeof organization === "string") {
      organization = [organization];
    }

    const { filename } = req.file ? req.file : { filename: "default.png" };
    const invalid = await validation(query, res, {
      username,
      password,
      organization,
    });
    if (invalid) {
      return;
    }
    await connection.beginTransaction();
    const [result] = await query("SELECT * from users WHERE username=?", [
      username
    ]);

    if (result) {
      res.status(403);
      await renderErrorPage(query, res, "既にユーザーが登録されています。");
      return;
    }

    for (let i = 0; i < organization.length; i++) {
      await query(
        "INSERT INTO belongs_organizations (organization_id, username) VALUES (?, ?)",
        [organization[i], username]
      );
    }

    const salt = genRandomString(16);
    const hash = await argon2.hash(salt + password);
    await query(
      "INSERT INTO users (username, salt, hash, last_name, first_name, icon) VALUES (?, ?, ?, ?, ?, ?)",
      [username, salt, hash, last_name, first_name, filename]
    );
    const sessionId = uuid();
    await query(
      "INSERT INTO session (id, username, expired_at) VALUES (?, ?, ?)",
      [sessionId, username, Number.parseInt(Date.now() / 1000 + 300)]
    );
    await connection.commit();

    res.cookie("session_id", sessionId);
    res.redirect("/");
  } catch (e) {
    console.error(e);
    await connection.rollback();
    res.status(500);
    await renderErrorPage(query, res, "エラーが発生しました。");
  } finally {
    await connection.release();
  }
});

async function validation(query, res, obj) {
  const { username, password, first_name, last_name, organization } = obj;
  let validationMessage = "";
  validationMessage = validateUsername(username);
  if (validationMessage) {
    res.status(400);
    await renderErrorPage(query, res, validationMessage);
    return validationMessage;
  }
  validationMessage = validatePassword(password, username);
  if (validationMessage) {
    res.status(400);
    await renderErrorPage(query, res, validationMessage);
    return validationMessage;
  }
  validationMessage = validateOrganizations(organization);
  if (validationMessage) {
    res.status(400);
    await renderErrorPage(query, res, validationMessage);
    return validationMessage;
  }
}

async function renderErrorPage(query, res, message) {
  const organizations = await query("SELECT * from organizations");
  res.render("register", { title: "りすこん", organizations, message });
}

module.exports = router;
