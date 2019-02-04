package bench

import (
	"bufio"
	"compress/gzip"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"
)

var (
	DataPath = "./data"
	DataSet  BenchDataSet
)

func reverse(s string) string {
	r := []rune(s)
	for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}

func prepareUserDataSet() {
	log.Println("datapath", DataPath)
	file, err := os.Open(filepath.Join(DataPath, "user.tsv"))
	must(err)
	defer file.Close()

	s := bufio.NewScanner(file)
	for i := 0; s.Scan(); i++ {
		line := strings.Split(s.Text(), "\t")
		displayName := strings.Split(line[0], " ")
		lastName := displayName[0]
		firstName := displayName[1]
		addr := line[1]
		userName := strings.Split(addr, "@")[0]

		user := &AppUser{
			Name:          userName,
			Password:      reverse(userName),
			FirstName:     firstName,
			LastName:      lastName,
			Organizations: []string{"1"},
		}

		_, err := os.Stat(filepath.Join(DataPath, "init", user.Name+"-default.jpeg"))
		if err == nil {
			user.AvatarSet = newAvatarSet(filepath.Join(DataPath, "init"), user.Name+"-default.jpeg")
		}
		if i < 1000 {
			DataSet.Users = append(DataSet.Users, user)
		} else {
			DataSet.NewUsers = append(DataSet.NewUsers, user)
		}
	}
}

func mustBytes(b []byte, err error) []byte {
	if err != nil {
		panic(err)
	}
	return b
}

func newAvatar(filePath string) *Avatar {
	return &Avatar{
		FilePath: filePath,
		Bytes:    mustBytes(ioutil.ReadFile(filePath)),
	}
}

func newAvatarSet(base, name string) *AvatarSet {
	return &AvatarSet{
		Origin: newAvatar(filepath.Join(base, name)),
		Small:  newAvatar(filepath.Join(base, "dx", "25", "dy", "25", name)),
		Middle: newAvatar(filepath.Join(base, "dx", "50", "dy", "50", name)),
		Large:  newAvatar(filepath.Join(base, "dx", "300", "dy", "300", name)),
	}
}

func prepareAvatarDataSet() {
	filePath := filepath.Join(DataPath, "default.png")
	DataSet.DefaultAvatar = &AvatarSet{
		Origin: &Avatar{
			FilePath: filePath,
			Bytes:    mustBytes(ioutil.ReadFile(filePath)),
		},
	}

	files, err := ioutil.ReadDir(filepath.Join(DataPath, "avatar"))
	must(err)

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".png") ||
			strings.HasSuffix(file.Name(), ".jpg") ||
			strings.HasSuffix(file.Name(), ".jpeg") ||
			strings.HasSuffix(file.Name(), ".gif") {

			// path := filepath.Join(DataPath, "avatar", file.Name())
			// assert(file.Size() <= 1*1024*1024, "invalid avatar size ", path)

			DataSet.Avatars = append(DataSet.Avatars, newAvatarSet(filepath.Join(DataPath, "avatar"), file.Name()))
		}
	}

	assert(0 < len(DataSet.Avatars), "no avatars")
}

func prepareUserAvatar() {
	rnd := rand.New(rand.NewSource(3656))

	for _, user := range DataSet.Users {
		user.AvatarSet = DataSet.Avatars[rnd.Intn(len(DataSet.Avatars))]
	}
}

func PrepareDataSet() {
	prepareUserDataSet()
	prepareAvatarDataSet()
	prepareUserAvatar()
}

var saltRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func genSalt(n int, rnd *rand.Rand) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = saltRunes[rnd.Intn(len(saltRunes))]
	}
	return string(b)
}

func fbadf(w io.Writer, f string, params ...interface{}) {
	for i, param := range params {
		switch v := param.(type) {
		case []byte:
			params[i] = fmt.Sprintf("_binary x'%s'", hex.EncodeToString(v))
		case *time.Time:
			params[i] = strconv.Quote(v.Format("2006-01-02 15:04:05"))
		case time.Time:
			params[i] = strconv.Quote(v.Format("2006-01-02 15:04:05"))
		default:
			params[i] = strconv.Quote(fmt.Sprint(v))
		}
	}
	fmt.Fprintf(w, f, params...)
}

func GenerateInitialDataSetSQL(outputPath string) {
	outFile, err := os.Create(outputPath)
	must(err)
	defer outFile.Close()

	w := gzip.NewWriter(outFile)
	defer w.Close()

	fbadf(w, "USE risukai;")
	fbadf(w, "SET NAMES utf8mb4;")
	fbadf(w, "BEGIN;")

	rnd := rand.New(rand.NewSource(3656))

	// user
	for _, user := range DataSet.Users {
		salt := genSalt(20, rnd)
		passDigest := argon2.Key([]byte(user.Password), []byte(salt), 3, 1<<12, 1, 32)
		must(err)
		avatarName := "default.png"
		if user.AvatarSet != nil {
			hash := sha1.Sum(user.AvatarSet.Origin.Bytes)
			avatarName = string(hash[:]) + filepath.Ext(user.AvatarSet.Origin.FilePath)
		}
		enc := base64.StdEncoding.WithPadding(base64.NoPadding)
		hash := fmt.Sprintf("$argon2i$v=%d$m=%d,t=%d,p=%d$%s$%s", argon2.Version, 1<<12, 3, 1, enc.EncodeToString([]byte(salt)), enc.EncodeToString(passDigest))
		fbadf(w, "INSERT INTO users (username, salt, hash, last_name, first_name, icon) VALUES (%s, %s, %s, %s, %s, %s);",
			user.Name, salt, hash, user.LastName, user.FirstName, avatarName)
	}

	fbadf(w, "COMMIT;")
}
