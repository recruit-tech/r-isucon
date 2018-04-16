package handlers

import (
	"net/http"

	"github.com/labstack/echo"
)

func GetLogout(c echo.Context) error {
	sessionId, err := c.Cookie("session_id")
	if err != nil {
		return c.Redirect(http.StatusFound, "/")
	}
	if len(sessionId.Value) == 0 {
		return c.Redirect(http.StatusFound, "/")
	}
	_, err = db.Query("DELETE FROM session WHERE id = ?", sessionId.Value)
	if err != nil {
		return err
	}
	cookie := new(http.Cookie)
	cookie.Name = "session_id"
	cookie.Value = ""
	cookie.MaxAge = -1
	c.SetCookie(cookie)
	return c.Redirect(http.StatusFound, "/")
}
