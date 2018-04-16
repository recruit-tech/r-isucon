package main

import (
	"encoding/json"
	"log"
	"os"
	"os/exec"
	"time"

	"github.com/gocraft/dbr"
	"github.com/yahoojapan/yisucon/benchmarker/db"
	"github.com/yahoojapan/yisucon/benchmarker/model"
)

type BenchResult struct {
	JobID   string `json:"job_id"`
	IPAddrs string `json:"ip_addrs"`

	Pass      bool     `json:"pass"`
	Score     int64    `json:"score"`
	Message   string   `json:"message"`
	Errors    []string `json:"error"`
	Logs      []string `json:"log"`
	LoadLevel int      `json:"load_level"`

	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	for {
		err := func() error {
			q, err := db.QueueChecker(2 * time.Second)
			if err != nil {
				return err
			}

			cmd := exec.Command("./bin/bench", "-remotes", q.Host.String, "-output", "result.json")
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr

			if err := cmd.Run(); err != nil {
				return err
			}

			f, err := os.Open("result.json")
			if err != nil {
				return err
			}
			defer f.Close()

			var result BenchResult
			if err := json.NewDecoder(f).Decode(&result); err != nil {
				return err
			}

			score := model.Score{
				Score:   dbr.NewNullInt64(result.Score),
				QueueID: q.QueueID,
				Message: dbr.NewNullString(result.Message),
			}

			if len(result.Errors) > 0 {
				score.Message.String += "\n\n"
				for _, es := range result.Errors {
					score.Message.String += es + "\n"
				}
			}

			if err := db.SaveResult(q.TeamID.Int64, &score); err != nil {
				return err
			}
			return nil
		}()
		if err != nil {
			return err
		}
	}
}
