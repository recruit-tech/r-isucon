package types

import "time"

type Session struct {
	ID        string `db:"id"`
	Username  string `db:"username"`
	ExpiredAt int64  `db:"expired_at"`
}

type User struct {
	Username  string    `db:"username"`
	Salt      string    `db:"salt"`
	Hash      string    `db:"hash"`
	LastName  string    `db:"last_name"`
	FirstName string    `db:"first_name"`
	Icon      string    `db:"icon"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type BelongsOrganization struct {
	ID        int64     `db:"organization_id"`
	Username  string    `db:"username"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type Organization struct {
	ID       int64  `db:"id"`
	ParentId int64  `db:"parent_id"`
	Name     string `db:"name"`
}

type Room struct {
	ID       int64  `db:"id"`
	Name     string `db:"name"`
	Location string `db:"location"`
}

type Reservation struct {
	ID        int64     `db:"id"`
	RoomID    int64     `db:"room_id"`
	Username  string    `db:"username"`
	Title     string    `db:"title"`
	Date      string    `db:"date"`
	StartTime string    `db:"start_time"`
	EndTime   string    `db:"end_time"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	User      User
}

type ReservableRoom struct {
	RoomID         int64 `db:"room_id"`
	OrganizationID int64 `db:"organization_id"`
}
