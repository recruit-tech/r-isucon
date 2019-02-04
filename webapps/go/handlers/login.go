package handlers

import (
	"net/http"

	"github.com/recruit-tech/r-isucon/webapps/go/types"

	"regexp"

	"time"

	"github.com/labstack/echo"
	"github.com/labstack/gommon/log"
	"github.com/tvdburgt/go-argon2"
)

func GetLogin(c echo.Context) error {
	result := map[string]interface{}{}
	return c.Render(http.StatusOK, "login", result)
}

func extractHash(hash string) map[string]string {
	r := regexp.MustCompile(`\$argon2i\$v=(?P<Version>\d+)\$m=(?P<Memory>\d+),t=(?P<Times>\d+),p=(?P<Parallel>\d+)\$(?P<Salt>.*)\$(?P<Hash>.*)`)
	s := r.FindStringSubmatch(hash)

	result := make(map[string]string)

	for i, name := range r.SubexpNames() {
		if i > 0 && i <= len(s) {
			result[name] = s[i]
		}
	}
	return result
}

func verify(password string, user types.User) (bool, error) {
	return argon2.VerifyEncoded(user.Hash, []byte(user.Salt+password))
}

func PostLogin(c echo.Context) error {
	result := map[string]interface{}{}
	username := c.FormValue("username")
	password := c.FormValue("password")

	users := []types.User{}
	db.Select(&users, "SELECT * FROM users WHERE username=?", username)
	if len(users) < 1 {
		result["Message"] = "ユーザ名もしくはパスワードが間違っています。"
		return c.Render(http.StatusBadRequest, "login", result)
	}
	ok, err := verify(password, users[0])
	if err != nil {
		log.Errorf("verify error %v", err)
		result["Message"] = "ユーザ名もしくはパスワードが間違っています。"
		return c.Render(http.StatusBadRequest, "login", result)
	}
	if !ok {
		result["Message"] = "ユーザ名もしくはパスワードが間違っています。"
		return c.Render(http.StatusBadRequest, "login", result)
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	sessionId := UUID()
	expired := time.Now().Add(5 * time.Minute)
	_, err = tx.Exec("INSERT INTO session (id, username, expired_at) VALUES (?, ?, ?) on duplicate key update username=?", sessionId, username, expired.Unix(), username)
	if err != nil {
		return err
	}
	cookie := new(http.Cookie)
	cookie.Name = "session_id"
	cookie.Value = sessionId
	cookie.Expires = time.Now().Add(5 * time.Minute)
	c.SetCookie(cookie)

	err = tx.Commit()
	if err != nil {
		return err
	}

	return c.Redirect(http.StatusFound, "/")
}
