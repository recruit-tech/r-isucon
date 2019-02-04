package handlers

import (
	"net/http"
	"time"

	"fmt"

	"github.com/labstack/echo"
	"github.com/recruit-tech/r-isucon/webapps/go/types"
)

type RangeTime struct {
	StartTime   string
	EndTime     string
	Colspan     int
	Reservation types.Reservation
}

type RoomWithTime struct {
	Room types.Room
	Time []RangeTime
}

func GetRangeTime() []RangeTime {
	start := 8
	end := 23
	diff := end - start
	rangeTimes := []RangeTime{}
	for i := 0; i < diff; i++ {
		hh1 := fmt.Sprintf("%02d", start+i)
		hh2 := fmt.Sprintf("%02d", start+i+1)
		rangeTimes = append(rangeTimes, RangeTime{
			StartTime: hh1 + ":00",
			EndTime:   hh1 + ":30",
		})
		rangeTimes = append(rangeTimes, RangeTime{
			StartTime: hh1 + ":30",
			EndTime:   hh2 + ":00",
		})
	}

	return rangeTimes
}

func GetIndex(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}

	user := u.(*types.User)
	date := c.QueryParam("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	belongsOrganizations := []types.BelongsOrganization{}
	err := db.Select(&belongsOrganizations, "SELECT * FROM belongs_organizations WHERE username=?", user.Username)
	if err != nil {
		return err
	}

	var reservableRoomsByOrg []types.Room

	added := make(map[int64]bool)
	for _, organization := range belongsOrganizations {
		reservableRooms := []types.ReservableRoom{}
		err := db.Select(&reservableRooms, "SELECT * FROM reservable_rooms WHERE organization_id=?", organization.ID)
		if err != nil {
			return err
		}
		for _, reservableRoom := range reservableRooms {
			if added[reservableRoom.RoomID] {
				continue
			}
			added[reservableRoom.RoomID] = true
			room := types.Room{}
			err = db.Get(&room, "SELECT * FROM rooms WHERE id=?", reservableRoom.RoomID)
			if err != nil {
				return err
			}
			reservableRoomsByOrg = append(reservableRoomsByOrg, room)
		}
	}

	rooms := []RoomWithTime{}
	for i, _ := range reservableRoomsByOrg {
		reservations := []types.Reservation{}
		err := db.Select(
			&reservations,
			"SELECT * FROM reservation WHERE date=? AND room_id=? ORDER BY start_time",
			date,
			reservableRoomsByOrg[i].ID)
		if err != nil {
			return err
		}
		times := GetRangeTime()
		for i, _ := range reservations {
			err := db.Get(&reservations[i].User, "SELECT * FROM users WHERE username=?", reservations[i].Username)
			if err != nil {
				return err
			}
			start, err := time.Parse("15:04:05", reservations[i].StartTime)
			if err != nil {
				return err
			}
			end, err := time.Parse("15:04:05", reservations[i].EndTime)
			if err != nil {
				return err
			}
			colspan := int(end.Sub(start).Minutes() / 30)
			for begin, _ := range times {
				if begin >= len(times) {
					break
				}
				s, err := time.Parse("15:04", times[begin].StartTime)
				if err != nil {
					s, err = time.Parse("15:04:05", times[begin].StartTime)
				}
				if err != nil {
					return err
				}
				if s.Equal(start) {
					times = append(times[:begin], append([]RangeTime{
						RangeTime{
							StartTime:   reservations[i].StartTime,
							EndTime:     reservations[i].EndTime,
							Colspan:     colspan,
							Reservation: reservations[i],
						},
					}, times[begin+colspan:]...)...,
					)
				}
			}
		}
		rooms = append(rooms, RoomWithTime{
			Room: reservableRoomsByOrg[i],
			Time: times,
		})
	}

	result := map[string]interface{}{
		"User":    user,
		"Message": nil,
		"Times":   GetRangeTime(),
		"Rooms":   rooms,
		"Date":    date,
	}
	return c.Render(http.StatusOK, "index", result)
}
