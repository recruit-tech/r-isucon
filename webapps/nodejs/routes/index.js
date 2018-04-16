"use strict";

const express = require("express");
const { promisify } = require("util");
const router = express.Router();
const { getDateFormat, getRangeTime, span } = require("../utils/time");
const rangeTime = getRangeTime();

router.get("/", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  const { username } = req.user;
  const app = require("../app");
  const db = app.get("db");
  const query = promisify(db.query.bind(db));
  const date = req.query.date || getDateFormat();
  const result = { user: req.user, message: null, times: rangeTime, date };
  try {
    const belongsOrgs = await query(
      "SELECT * FROM belongs_organizations WHERE username=?",
      [username]
    );
    const reservableRooms = [];
    for (const belongsOrg of belongsOrgs) {
      const roomsByOrg = await query(
        "SELECT * FROM reservable_rooms WHERE organization_id=?",
        [belongsOrg.organization_id]
      );
      roomsByOrg.forEach(room => {
        if (!reservableRooms.includes(room.room_id)) {
          reservableRooms.push(room.room_id);
        }
      });
    }

    const rooms = [];
    for (const reservableRoom of reservableRooms) {
      const [room] = await query("SELECT * FROM rooms WHERE id=?", [
        reservableRoom
      ]);

      const reservations = await query(
        "SELECT * FROM reservation WHERE date=? AND room_id=? ORDER BY start_time",
        [date, room.id]
      );

      const times = [...rangeTime];
      for (const reservation of reservations) {
        const [user] = await query("SELECT * FROM users WHERE username=?", [
          reservation.username
        ]);
        const reservationStart = new Date(
          `2001/01/01 ${reservation.start_time}`
        );
        const reservationEnd = new Date(`2001/01/01 ${reservation.end_time}`);
        const colspan = span(reservationStart, reservationEnd, 30);
        const beginIndex = times.findIndex(time => {
          const timeStart = new Date(`2001/01/01 ${time.start_time}`);
          return +timeStart === +reservationStart;
        });
        reservation.user = user;
        times.splice(beginIndex, colspan, {
          start_time: reservation.start_time,
          end_time: reservation.end_time,
          colspan: colspan,
          reservation
        });
      }
      room.times = times;

      rooms.push(room);
    }
    result.rooms = rooms;
    result.date = date;
    res.render("index", result);
  } catch (e) {
    console.error(e);
    result.message = "エラーが発生しました";
    res.status(500);
    res.render("index", result);
  }
});

module.exports = router;
