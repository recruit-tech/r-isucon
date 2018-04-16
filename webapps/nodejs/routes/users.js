"use strict";

const express = require("express");
const { promisify } = require("util");
const router = express.Router();
const multer = require("multer");
const mimes = require("mime-types");
const path = require("path");
const uuid = require("uuid/v4");
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(__dirname, "..", "..", "uploads/"));
  },
  filename(req, file, cb) {
    if (!req.user) {
      return cb(new Error("cannot find user from session"))
    }
    const ext = mimes.extension(file.mimetype);
    if (ext != "jpeg" && ext != "jpg" && ext != "png" && ext != "gif") {
      return cb(null, "default.png");
    }
    cb(
      null,
      `${req.user.username}-${Date.now()}.${uuid()}.${mimes.extension(file.mimetype)}`
    );
  }
});
const uploads = multer({ storage: storage });
const { validateOrganizations } = require("../utils/validator");

router.get("/", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const username = req.user.username;
  try {
    await renderUserPage(username, req, res);
  } catch (e) {
    console.error(e);
    res.status(500);
    res.render("user", {
      message: "エラーが発生しました。",
      user: null,
      organizations: null,
      last_name: null,
      first_name: null,
      ismine: false
    });
  }
});

router.post("/", uploads.single("icon"), async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const username = req.user.username;
  const app = require("../app");
  const db = app.get("db");
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  try {
    const { first_name, last_name } = req.body;
    let organization = req.body.organization;
    if (typeof organization === "string") {
      organization = [organization];
    }
    const { filename } = req.file ? req.file : { filename: "" };
    const validationMessage = validate({ first_name, last_name, organization });
    if (validationMessage) {
      res.status(400);
      await renderUserPage(username, req, res, validationMessage);
      return;
    }

    await connection.beginTransaction();
    await query("DELETE FROM belongs_organizations WHERE username=?", [
      username
    ]);
    for (let i = 0; i < organization.length; i++) {
      await query(
        "INSERT INTO belongs_organizations (organization_id, username) VALUES (?, ?)",
        [organization[i], username]
      );
    }

    if (filename) {
      await query(
        "UPDATE users SET first_name=?, last_name=?, icon=? WHERE username=?",
        [first_name, last_name, filename, username]
      );
    } else {
      await query(
        "UPDATE users SET first_name=?, last_name=? WHERE username=?",
        [first_name, last_name, username]
      );
    }

    await connection.commit();
    res.redirect("/");
  } catch (e) {
    console.error(e);
    await connection.rollback();
    res.status(500);
    res.render("user", {
      message: "エラーが発生しました。",
      user: null,
      organizations: null,
      ismine: false
    });
  } finally {
    await connection.release();
  }
});

router.get("/:username", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const username = req.params.username;
  try {
    await renderUserPage(username, req, res);
  } catch (e) {
    console.error(e);
    res.status(500);
    res.render("user", {
      message: "エラーが発生しました。",
      user: null,
      organizations: null,
      last_name: null,
      first_name: null,
      ismine: false
    });
  }
});

async function renderUserPage(username, req, res, validateMessage) {
  const result = {
    message: null,
    user: req.user,
    icon: null,
    organizations: null,
    last_name: null,
    first_name: null,
    ismine: false
  };
  if (!username) {
    result.message = "ユーザーが見つかりません";
    res.status(404);
    res.render("user", result);
    return;
  }
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const [user] = await query("SELECT * from users WHERE username=?", [
    username
  ]);
  if (!user) {
    result.message = "ユーザーが見つかりません";
    res.status(404);
    res.render("user", result);
    return;
  }
  const belongsOrgs = await query(
    "SELECT * FROM belongs_organizations WHERE username=?",
    [username]
  );
  const orgs = [];
  for (const belongsOrg of belongsOrgs) {
    const orgId = belongsOrg.organization_id;
    const [org] = await query("SELECT * FROM organizations WHERE id=?", [
      orgId
    ]);
    orgs.push(org);
  }
  const { last_name, first_name, icon } = user;
  result.last_name = last_name;
  result.first_name = first_name;
  result.icon = icon;
  result.ismine = req.user && req.user.username === username;
  result.belongsOrgs = orgs;
  if (result.ismine) {
    const organizations = await query("SELECT * from organizations");
    result.organizations = organizations;
  }
  if (validateMessage) {
    result.message = validateMessage;
  }
  res.render("user", result);
}

function validate(obj) {
  const { organization } = obj;
  const validationMessage = validateOrganizations(organization);
  if (validationMessage) {
    return validationMessage;
  }
}

module.exports = router;
