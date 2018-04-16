package handlers

import (
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

var (
	db *sqlx.DB
)

func init() {
	db_host := os.Getenv("RISUCON_DB_HOST")
	if db_host == "" {
		db_host = "127.0.0.1"
	}
	db_port := os.Getenv("RISUCON_DB_PORT")
	if db_port == "" {
		db_port = "3306"
	}
	db_user := os.Getenv("RISUCON_DB_USER")
	if db_user == "" {
		db_user = "root"
	}
	db_password := os.Getenv("RISUCON_DB_PASSWORD")
	if db_password != "" {
		db_password = ":" + db_password
	}
	db_name := os.Getenv("RISUCON_DB_NAME")
	if db_name == "" {
		db_name = "risukai"
	}

	dsn := fmt.Sprintf("%s%s@tcp(%s:%s)/%s?parseTime=true&loc=Local&charset=utf8mb4",
		db_user, db_password, db_host, db_port, db_name)

	log.Printf("Connecting to db: %q", dsn)
	var err error
	db, err = sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	for {
		err := db.Ping()
		if err == nil {
			break
		}
		log.Println(err)
		time.Sleep(time.Second * 3)
	}

	db.SetMaxOpenConns(100)
	db.SetConnMaxLifetime(10 * time.Second)
	log.Printf("Succeeded to connect db.")
}
