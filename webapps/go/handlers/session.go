package handlers

import (
	"time"

	"net/http"

	"path"

	"github.com/labstack/echo"
	"github.com/labstack/gommon/log"
	"github.com/orisano/r-isucon/webapps/go/types"
)

func SessionMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		p := c.Request().URL.Path
		ext := path.Ext(p)
		if ext != "" {
			if err := next(c); err != nil {
				log.Errorf("error: %v", err)
				c.Error(err)
			}
			return nil
		}
		var sessionId *http.Cookie
		for _, cookie := range c.Cookies() {
			if cookie.Name == "session_id" && cookie.Value != "" {
				sessionId = cookie
			}
		}
		if sessionId == nil {
			if err := next(c); err != nil {
				c.Error(err)
			}
			return nil
		}
		if len(sessionId.Value) == 0 {
			if err := next(c); err != nil {
				c.Error(err)
			}
			return nil
		}
		session := types.Session{}
		err := db.Get(&session, "SELECT * FROM session WHERE id=?", sessionId.Value)
		if err != nil {
			cookie := new(http.Cookie)
			cookie.Name = "session_id"
			cookie.Value = ""
			cookie.MaxAge = -1
			c.SetCookie(cookie)
			return nil
		}

		expired := time.Now().Add(5 * time.Minute)
		if expired.Unix() >= session.ExpiredAt {
			user := types.User{}
			err = db.Get(&user, "SELECT * FROM users WHERE username=?", session.Username)
			if err != nil {
				return err
			}
			_, err = db.Query("UPDATE session SET expired_at = ? WHERE id = ?", expired.Unix(), session.ID)
			if err != nil {
				return err
			}
			cookie := new(http.Cookie)
			cookie.Name = "session_id"
			cookie.Value = session.ID
			cookie.Expires = time.Now().Add(5 * time.Minute)
			c.SetCookie(cookie)
			c.Set("user", &user)
		} else {
			_, err = db.Query("DELETE FROM session WHERE id = ?", sessionId.Value)
			if err != nil {
				return err
			}
			cookie := new(http.Cookie)
			cookie.Name = "session_id"
			cookie.Value = ""
			cookie.MaxAge = -1
			c.SetCookie(cookie)
		}

		if err := next(c); err != nil {
			log.Errorf("error: %v", err)
			c.Error(err)
		}
		return nil
	}
}
