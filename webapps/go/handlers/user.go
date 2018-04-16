package handlers

import (
	"net/http"

	"database/sql"

	"fmt"
	"io"
	"mime"
	"os"
	"time"

	"github.com/labstack/echo"
	"github.com/orisano/r-isucon/webapps/go/types"
)

func GetUser(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}
	result := map[string]interface{}{}
	user := u.(*types.User)

	username := c.Param("username")
	usr := types.User{}
	err := db.Get(&usr, "SELECT * FROM users WHERE username = ?", username)
	if err != nil {
		if err == sql.ErrNoRows {
			result["Message"] = "ユーザーが見つかりません"
			return c.Render(http.StatusNotFound, "user", result)
		}
		return err
	}
	result["LastName"] = usr.LastName
	result["FirstName"] = usr.FirstName
	result["Mine"] = username == user.Username
	result["User"] = user
	result["Icon"] = usr.Icon
	organizations := []types.Organization{}
	err = db.Select(&organizations, "SELECT * FROM organizations")
	if err != nil {
		return err
	}
	result["Organizations"] = organizations

	belongsOrganizations := []types.BelongsOrganization{}
	err = db.Select(&belongsOrganizations, "SELECT * FROM belongs_organizations WHERE username = ?", username)
	if err != nil {
		return err
	}
	result["BelongsOrganizations"] = belongsOrganizations

	return c.Render(http.StatusOK, "user", result)
}

func PostUser(c echo.Context) error {
	u := c.Get("user")
	if u == nil {
		return c.Redirect(http.StatusFound, "/login")
	}
	user := u.(*types.User)
	f, e := c.FormParams()
	if e != nil {
		return e
	}
	firstName := c.FormValue("first_name")
	lastName := c.FormValue("last_name")
	organization := f["organization"]
	result := map[string]interface{}{}
	message := ValidateOrganizations(organization)
	if message != "" {
		result["Message"] = message
		return c.Render(http.StatusBadRequest, "user", result)
	}

	var filename string
	if fh, err := c.FormFile("icon"); err == http.ErrMissingFile {
		filename = ""
	} else if err != nil {
		filename = ""
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
				filename = fmt.Sprintf("%s-%d-%s%s", user.Username, now, UUID(), extensions[0])
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

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	_, err = tx.Exec("DELETE FROM belongs_organizations WHERE username=?", user.Username)
	if err != nil {
		return err
	}

	for _, organizationId := range organization {
		_, err := tx.Exec("INSERT INTO belongs_organizations (organization_id, username) VALUES (?, ?)", organizationId, user.Username)
		if err != nil {
			return err
		}
	}

	if filename != "" {
		_, err := tx.Exec("UPDATE users SET first_name=?, last_name=?, icon=? WHERE username=?", firstName, lastName, filename, user.Username)
		if err != nil {
			return err
		}
	} else {
		_, err := tx.Exec("UPDATE users SET first_name=?, last_name=? WHERE username=?", firstName, lastName, user.Username)
		if err != nil {
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}
	return c.Redirect(http.StatusFound, "/")
}
