package main

import (
	crand "crypto/rand"
	"html/template"
	"math/rand"
	"os/exec"

	"io"

	"encoding/binary"

	"strconv"

	"os"

	"fmt"

	"path"

	"mime"

	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/orisano/r-isucon/webapps/go/handlers"
)

type Renderer struct {
	templates *template.Template
}

func (r *Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return r.templates.ExecuteTemplate(w, name, data)
}

func init() {
	seedBuf := make([]byte, 8)
	crand.Read(seedBuf)
	rand.Seed(int64(binary.LittleEndian.Uint64(seedBuf)))
}

func main() {
	e := echo.New()
	e.Renderer = &Renderer{
		templates: template.Must(template.New("").ParseGlob("views/*.html")),
	}
	// Middleware
	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Use(middleware.Static("../public"))
	e.GET("/initialize", func(c echo.Context) error {
		cmd := exec.Command("sh", "-c", "mysql -uroot -ppassword risukai < ../sql/01_tables_data.sql")
		err := cmd.Run()
		if err != nil {
			return err
		}
		return c.String(200, "OK")
	})
	e.GET("/dx/:dx/dy/:dy/:imagePath", func(c echo.Context) error {
		x := c.Param("dx")
		y := c.Param("dy")
		imagePath := c.Param("imagePath")
		dx, err := strconv.Atoi(x)
		if err != nil {
			return fmt.Errorf("%s", "画像を変換できません")
		}
		dy, err := strconv.Atoi(y)
		if err != nil {
			return fmt.Errorf("%s", "画像を変換できません")
		}
		ext := path.Ext(imagePath)

		if ext != ".jpg" && ext != ".png" && ext != ".gif" && ext != ".webp" && ext != ".jpeg" {
			return fmt.Errorf("%s", "画像を変換できません")
		}
		tmpDir := os.TempDir()
		outputPath := fmt.Sprintf("%s/%s", tmpDir, imagePath)
		cmd := exec.Command(
			"magick",
			"convert", "../uploads/"+imagePath, "-resize", fmt.Sprintf("%dx%d", dx, dy), outputPath)
		err = cmd.Run()
		if err != nil {
			return err
		}
		mimes := mime.TypeByExtension(ext)
		c.Response().Header().Set("Content-Type", mimes)

		return c.File(outputPath)
	})
	e.Use(handlers.SessionMiddleware)
	// Routes
	e.GET("/", handlers.GetIndex)
	e.GET("/login", handlers.GetLogin)
	e.POST("/login", handlers.PostLogin)
	e.GET("/logout", handlers.GetLogout)
	e.GET("/register", handlers.GetRegister)
	e.POST("/register", handlers.PostRegister)
	e.GET("/reservations", handlers.GetReservations)
	e.GET("/reservations/:reservationId", handlers.GetReservation)
	e.POST("/reservations", handlers.PostReservation)
	e.POST("/reservations/:reservationId", handlers.PutReservation)
	e.GET("/users/:username", handlers.GetUser)
	e.POST("/users", handlers.PostUser)

	s := &http.Server{
		Addr: ":3000",
	}
	// Start server
	e.Logger.Fatal(e.StartServer(s))
}
