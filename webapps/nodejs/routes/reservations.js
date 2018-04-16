"use strict";

const express = require("express");
const { promisify } = require("util");
const router = express.Router();
const { plusTime, getRangeTime, getDateFormat } = require("../utils/time");
const rangeTime = getRangeTime();

router.get("/", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const { start, date, room_id } = req.query;
  const { username } = req.user;
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const result = {
    message: null,
    room_id,
    reservableRooms: null,
    start,
    end: plusTime(start, 30),
    date,
    title: null,
    user: req.user,
    rangeTime
  };

  try {
    const reservableRooms = await getReservableRooms(query, username);
    if (!reservableRooms.some(room => room.id === +room_id)) {
      result.message = "予約できない部屋です";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    result.reservableRooms = reservableRooms;

    res.render("reservation", result);
  } catch (e) {
    result.message = "エラーが発生しました";
    res.status(500);
    res.render("reservation", result);
  }
});

router.post("/", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const { room_id, date, start, end, title } = req.body;
  const { username } = req.user;
  const app = require("../app");
  const db = app.get("db");
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  const result = {
    message: null,
    room_id,
    reservableRooms: null,
    start,
    end,
    date,
    title,
    user: req.user,
    rangeTime
  };

  try {
    await connection.beginTransaction();
    const reservableRooms = await getReservableRooms(query, username);
    result.reservableRooms = reservableRooms;
    if (!reservableRooms.some(room => room.id === +room_id)) {
      result.message = "予約できない部屋です";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    const startDate = new Date(`${date} ${start}`);
    const endDate = new Date(`${date} ${end}`);

    if (endDate <= startDate) {
        result.message = "終了時刻が開始時刻と同じかそれよりも前にあります";
        res.status(400);
        res.render("reservation", result);
    }

    const [alreadyReserved] = await query(
      "SELECT * FROM reservation WHERE room_id=? AND date=? AND ((CAST(? AS TIME) < end_time AND CAST(? AS TIME) > start_time))",
      [room_id, date, start, end]
    );

    if (alreadyReserved) {
      result.message = "すでにその時間で予約されています";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    await query(
      "INSERT INTO reservation (room_id, username, title, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
      [room_id, username, title, date, start, end]
    );
    await connection.commit();

    res.redirect("/?date=" + date);
  } catch (e) {
    await connection.rollback();
    result.message = "エラーが発生しました";
    res.status(500);
    res.render("reservation", result);
  } finally {
    await connection.release();
  }
});

router.get("/:reservationId", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const { reservationId } = req.params;
  const { username } = req.user;
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const result = {
    message: null,
    room_id: null,
    reservableRooms: null,
    start: null,
    end: null,
    date: null,
    title: null,
    user: req.user,
    rangeTime
  };

  try {
    const [reservation] = await query("SELECT * FROM reservation WHERE id=?", [
      reservationId
    ]);

    if (!reservation) {
      result.message = "予約がありません";
      res.status(404);
      res.render("reservation", result);
      return;
    }

    const reservableRooms = await getReservableRooms(query, username);
    result.reservableRooms = reservableRooms;
    if (!reservableRooms.some(room => room.id === +reservation.room_id)) {
      result.message = "予約できない部屋です";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    result.room_id = reservation.room_id;
    result.start = reservation.start_time.substring(0, 5);
    result.end = reservation.end_time.substring(0, 5);
    const date = new Date(reservation.date);
    result.date = getDateFormat(date);
    result.title = reservation.title;

    res.render("reservation", result);
  } catch (e) {
    console.error(e);
    result.message = "エラーが発生しました";
    res.status(500);
    res.render("reservation", result);
  }
});

router.post("/:reservationId", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const { reservationId } = req.params;
  const { username } = req.user;
  const { room_id, start, end, title, date } = req.body;
  const app = require("../app");
  const db = app.get("db");
  const getConnection = promisify(db.getConnection.bind(db));
  const connection = await getConnection();
  const query = promisify(connection.query.bind(connection));
  const result = {
    message: null,
    room_id,
    reservableRooms: null,
    start,
    end,
    date,
    title,
    user: req.user,
    rangeTime
  };
  try {
    await connection.beginTransaction();

    const [reservation] = await query("SELECT * FROM reservation WHERE id=?", [
      reservationId
    ]);

    if (reservation.username !== username) {
      result.message = "本人が予約したものではありません";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    const reservableRooms = await getReservableRooms(query, username);
    result.reservableRooms = reservableRooms;

    if (!reservableRooms.some(room => room.id === +reservation.room_id)) {
      result.message = "予約できない部屋です";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    const [alreadyOtherReserved] = await query(
      "SELECT * FROM reservation WHERE room_id=? AND date=? AND id!=? AND (CAST(? AS TIME) < end_time AND CAST(? AS TIME) > start_time)",
      [room_id, date, reservationId, start, end]
    );

    if (alreadyOtherReserved) {
      result.message = "既にその時間に他の予約が存在します";
      res.status(403);
      res.render("reservation", result);
      return;
    }

    await query(
      "UPDATE reservation SET date=?, start_time=?, end_time=?, title=?, room_id=? WHERE id=?",
      [date, start, end, title, room_id, reservationId]
    );

    await connection.commit();
    res.redirect("/?date=" + date);
  } catch (e) {
    console.error(e);
    await connection.rollback();
    result.message = "エラーが発生しました";
    res.status(500);
    res.render("reservation", result);
  } finally {
    await connection.release();
  }
});

async function getReservableRooms(query, username) {
  const belongs_orgs = await query(
    "SELECT * FROM belongs_organizations WHERE username=?",
    [username]
  );
  const reservableRooms = [];
  for (const belongs_org of belongs_orgs) {
    const roomsByOrg = await query(
      "SELECT * FROM reservable_rooms WHERE organization_id=?",
      [belongs_org.organization_id]
    );
    for (const roomByOrg of roomsByOrg) {
      if (!reservableRooms.find(room => room.id === roomByOrg.room_id)) {
        const [room] = await query("SELECT * FROM rooms WHERE id=?", [
          roomByOrg.room_id
        ]);
        reservableRooms.push(room);
      }
    }
  }
  return reservableRooms;
}

module.exports = router;
