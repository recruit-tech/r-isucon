package handlers

import (
	"net/http"

	"strconv"

	"time"

	"github.com/labstack/echo"
	"github.com/recruit-tech/r-isucon/webapps/go/types"
)

func GetReservations(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}

	id := c.QueryParam("room_id")
	start := c.QueryParam("start")
	date := c.QueryParam("date")
	roomId, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return err
	}
	user := u.(*types.User)
	rooms, err := getReservableRooms(user.Username)
	if err != nil {
		return err
	}
	reservable := false
	for _, room := range rooms {
		if room.ID == roomId {
			reservable = true
			break
		}
	}
	result := map[string]interface{}{}

	if !reservable {
		result["Message"] = "予約できない部屋です。"
		c.Render(http.StatusForbidden, "reservation", result)
	}

	result["ReservableRooms"] = rooms
	result["RoomId"] = roomId
	result["Date"] = date
	result["Start"] = start
	end, _ := time.Parse("15:04", start)
	end = end.Add(time.Minute * 30)
	result["End"] = end.Format("15:04")
	result["Title"] = ""
	result["RangeTime"] = GetRangeTime()
	result["User"] = user
	return c.Render(http.StatusOK, "reservation", result)
}

func GetReservation(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}

	reservationId := c.Param("reservationId")

	reservation := types.Reservation{}
	db.Get(&reservation, "SELECT * FROM reservation WHERE id = ?", reservationId)
	user := u.(*types.User)
	rooms, err := getReservableRooms(user.Username)
	if err != nil {
		return err
	}
	reservable := false
	for _, room := range rooms {
		if room.ID == reservation.RoomID {
			reservable = true
			break
		}
	}
	result := map[string]interface{}{}

	if !reservable {
		result["Message"] = "予約できない部屋です。"
		c.Render(http.StatusForbidden, "reservation", result)
	}

	result["ReservableRooms"] = rooms
	result["RoomId"] = reservation.RoomID
	result["Date"] = formatDate(reservation.Date)
	result["Start"] = formatTime(reservation.StartTime)
	result["End"] = formatTime(reservation.EndTime)
	result["Title"] = reservation.Title
	result["RangeTime"] = GetRangeTime()
	result["User"] = user
	return c.Render(http.StatusOK, "reservation", result)
}

func PostReservation(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}
	id := c.FormValue("room_id")
	roomId, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return err
	}
	date := c.FormValue("date")
	title := c.FormValue("title")
	start := c.FormValue("start")
	end := c.FormValue("end")
	user := u.(*types.User)
	rooms, err := getReservableRooms(user.Username)
	if err != nil {
		return err
	}
	reservable := false
	for _, room := range rooms {
		if room.ID == roomId {
			reservable = true
			break
		}
	}
	result := map[string]interface{}{}
	result["Date"] = date
	result["Title"] = title
	result["Start"] = start
	result["End"] = end
	result["RangeTime"] = GetRangeTime()
	result["User"] = user
	result["ReservableRooms"] = rooms
	result["RoomId"] = roomId

	if !reservable {
		result["Message"] = "予約できない部屋です。"
		c.Render(http.StatusForbidden, "reservation", result)
	}
	s, err := time.Parse("15:04", start)
	if err != nil {
		result["Message"] = "開始時刻が不正です"
		return c.Render(http.StatusBadRequest, "reservation", result)
	}
	e, err := time.Parse("15:04", end)
	if err != nil {
		result["Message"] = "終了時刻が不正です"
		return c.Render(http.StatusBadRequest, "reservation", result)
	}
	if s.Equal(e) || s.After(e) {
		result["Message"] = "終了時刻が開始時刻と同じかそれよりも前にあります"
		return c.Render(http.StatusBadRequest, "reservation", result)
	}

	alreadyReserved := 0
	db.Get(
		&alreadyReserved,
		"SELECT COUNT(*) FROM reservation WHERE room_id=? AND date=? AND ((CAST(? AS TIME) < end_time AND CAST(? AS TIME) > start_time))",
		roomId, date, start, end)

	if alreadyReserved != 0 {
		result["Message"] = "すでにその時間で予約されています"
		return c.Render(http.StatusForbidden, "reservation", result)
	}

	db.Query("INSERT INTO reservation (room_id, username, title, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
		roomId, user.Username, title, date, start, end)

	return c.Redirect(http.StatusFound, "/?date="+date)
}

func PutReservation(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}
	user := u.(*types.User)
	result := map[string]interface{}{}
	reservationId := c.Param("reservationId")
	id := c.FormValue("room_id")
	roomId, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return err
	}
	date := c.FormValue("date")
	title := c.FormValue("title")
	start := c.FormValue("start")
	end := c.FormValue("end")

	reservation := types.Reservation{}
	err = db.Get(&reservation, "SELECT * FROM reservation WHERE id = ?", reservationId)
	if err != nil {
		return err
	}

	if reservation.Username != user.Username {
		result["Message"] = "本人が予約したものではありません"
		return c.Render(http.StatusForbidden, "reservation", result)
	}

	rooms, err := getReservableRooms(user.Username)
	if err != nil {
		return err
	}
	reservable := false
	for _, room := range rooms {
		if room.ID == roomId {
			reservable = true
			break
		}
	}

	if !reservable {
		result["Message"] = "予約できない部屋です"
		c.Render(http.StatusForbidden, "reservation", result)
	}

	alreadyReserved := 0
	db.Get(
		&alreadyReserved,
		"SELECT COUNT(*) FROM reservation WHERE room_id=? AND date=? AND id!=? AND ((CAST(? AS TIME) < end_time AND CAST(? AS TIME) > start_time))",
		roomId, date, reservationId, start, end)

	if alreadyReserved > 0 {
		result["Message"] = "既にその時間に他の予約が存在します"
		c.Render(http.StatusForbidden, "reservation", result)
	}

	db.Query(
		"UPDATE reservation SET date=?, start_time=?, end_time=?, title=?, room_id=? WHERE id=?",
		date, start, end, title, roomId, reservationId)

	return c.Redirect(http.StatusFound, "/?date="+date)
}

func getReservableRooms(username string) ([]types.Room, error) {
	belongsOrganizations := []types.BelongsOrganization{}
	err := db.Select(&belongsOrganizations, "SELECT * FROM belongs_organizations WHERE username = ?", username)
	if err != nil {
		return nil, err
	}
	added := make(map[int64]bool)
	rooms := []types.Room{}
	for _, belongsOrganization := range belongsOrganizations {
		reservableRooms := []types.ReservableRoom{}
		err := db.Select(&reservableRooms, "SELECT * FROM reservable_rooms WHERE organization_id = ?", belongsOrganization.ID)
		if err != nil {
			return nil, err
		}
		for _, reservableRoom := range reservableRooms {
			if added[reservableRoom.RoomID] {
				continue
			}
			added[reservableRoom.RoomID] = true
			room := types.Room{}
			err = db.Get(&room, "SELECT * FROM rooms WHERE id = ?", reservableRoom.RoomID)
			rooms = append(rooms, room)
		}
	}
	return rooms, nil
}

func formatTime(t string) string {
	s, _ := time.Parse("15:04:05", t)
	return s.Format("15:04")
}

func formatDate(t string) string {
	s, _ := time.Parse("2006-01-02T15:04:05-07:00", t)
	return s.Format("2006-01-02")
}
