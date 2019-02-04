package handlers

import (
	"fmt"
	"io"
	"math/rand"
	"mime"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo"
	"github.com/recruit-tech/r-isucon/webapps/go/types"
	"github.com/tvdburgt/go-argon2"
)

func GetRegister(c echo.Context) error {
	organizations := []types.Organization{}
	err := db.Select(&organizations, "SELECT * FROM organizations")
	if err != nil {
		return err
	}
	result := map[string]interface{}{
		"Organizations": organizations,
	}
	return c.Render(http.StatusOK, "register", result)
}

func UUID() string {
	id := uuid.New()
	return id.String()
}

const LettersAndDigits = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randomString(n int) string {
	b := make([]byte, n)
	z := len(LettersAndDigits)

	for i := 0; i < n; i++ {
		b[i] = LettersAndDigits[rand.Intn(z)]
	}
	return string(b)
}

func PostRegister(c echo.Context) error {
	f, e := c.FormParams()
	if e != nil {
		return e
	}
	username := c.FormValue("username")
	password := c.FormValue("password")
	firstName := c.FormValue("first_name")
	lastName := c.FormValue("last_name")
	organization := f["organization"]
	organizations := []types.Organization{}
	err := db.Select(&organizations, "SELECT * FROM organizations")
	if err != nil {
		return err
	}
	result := map[string]interface{}{
		"Username":      username,
		"Password":      password,
		"FirstName":     firstName,
		"LastName":      lastName,
		"Organizations": organizations,
	}

	message := ValidateUsername(username)
	if len(message) > 0 {
		result["Message"] = message
		return c.Render(http.StatusBadRequest, "register", result)
	}
	message = ValidatePassword(password, username)
	if len(message) > 0 {
		result["Message"] = message
		return c.Render(http.StatusBadRequest, "register", result)
	}
	message = ValidateOrganizations(organization)
	if len(message) > 0 {
		result["Message"] = message
		return c.Render(http.StatusBadRequest, "register", result)
	}

	var filename string
	if fh, err := c.FormFile("icon"); err == http.ErrMissingFile {
		filename = "default.png"
	} else if err != nil {
		filename = "default.png"
	} else {
		src, err := fh.Open()
		if err != nil {
			return err
		}
		defer src.Close()

		extensions, err := mime.ExtensionsByType(fh.Header.Get("Content-Type"))
		if err != nil {
			filename = "default.png"
		} else {
			extension := extensions[0]
			if extension != ".jpeg" && extension != ".jpg" && extension != ".png" && extension != ".gif" {
				filename = "default.png"
			} else {

				now := time.Now().Unix()
				filename = fmt.Sprintf("%s-%d-%s%s", username, now, UUID(), extensions[0])
				dst, err := os.Create(fmt.Sprintf("../uploads/%s", filename))
				if err != nil {
					return err
				}
				defer dst.Close()

				if _, err = io.Copy(dst, src); err != nil {
					return err
				}
			}

		}
	}

	users := []types.User{}
	err = db.Select(&users, "SELECT * from users WHERE username=?", username)
	if err != nil {
		return err
	}
	if len(users) > 0 {
		result["Message"] = "既にユーザーが登録されています。"
		return c.Render(http.StatusForbidden, "register", result)
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	for _, organization_id := range organization {
		_, err := tx.Exec("INSERT INTO belongs_organizations (organization_id, username) VALUES (?, ?)", organization_id, username)
		if err != nil {
			return err
		}
	}

	salt := randomString(16)

	ctx := &argon2.Context{
		Iterations:  3,
		Memory:      1 << 12,
		Parallelism: 1,
		HashLen:     32,
		Mode:        argon2.ModeArgon2i,
		Version:     argon2.VersionDefault,
	}

	hash, err := argon2.HashEncoded(ctx, []byte(salt+password), []byte(salt))
	_, err = tx.Exec("INSERT INTO users (username, salt, hash, last_name, first_name, icon) VALUES (?, ?, ?, ?, ?, ?)", username, salt, hash, lastName, firstName, filename)
	if err != nil {
		return err
	}

	sessionId := UUID()
	expired := time.Now().Add(5 * time.Minute)
	_, err = tx.Exec("INSERT INTO session (id, username, expired_at) VALUES (?, ?, ?)", sessionId, username, expired.Unix())
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
