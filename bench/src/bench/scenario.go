package bench

import (
	"bench/counter"
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	_ "github.com/chai2010/webp"
	"github.com/mattn/go-ciede2000"
	"golang.org/x/net/html"
)

type Image struct {
	Width, Height int
	URL           string
}

func MimeType(fileName string) string {
	switch filepath.Ext(fileName) {
	case ".jpeg", ".jpg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".png":
		return "image/png"
	}
	return ""
}

func checkHTML(f func(*http.Response, *goquery.Document) error) func(*http.Response, *bytes.Buffer) error {
	return func(res *http.Response, body *bytes.Buffer) error {
		doc, err := goquery.NewDocumentFromReader(body)
		if err != nil {
			return fatalErrorf("ページのHTMLがパースできませんでした")
		}
		return f(res, doc)
	}
}

func checkAvatar(ctx context.Context, checker *Checker, user *AppUser, img *Image) error {
	return checker.Play(ctx, &CheckAction{
		EnableCache:          true,
		SkipIfCacheAvailable: true,

		Method: "GET",
		Path:   img.URL,
		CheckFunc: func(res *http.Response, body *bytes.Buffer) error {
			// Note. EnableCache時はPlay時に自動でResponseは最後まで読まれる
			if res.StatusCode == http.StatusOK {
				counter.IncKey("staticfile-200")
			} else if res.StatusCode == http.StatusNotModified {
				counter.IncKey("staticfile-304")
			} else {
				return fmt.Errorf("期待していないステータスコード %d", res.StatusCode)
			}
			avatar, _, err := image.Decode(body)
			if err != nil {
				log.Println("[broken image]: ", res.Request.URL.String())
				return nil
			}
			return nil
			if !strings.HasPrefix(path.Base(img.URL)+"-", user.Name) {
				return nil
			}
			b := avatar.Bounds()
			if !(b.Dx() == img.Width || b.Dy() == img.Height) {
				return fatalErrorf("画像がリサイズされていません")
			}
			sz := 0
			if b.Dx() == img.Width {
				sz = img.Width
			}
			if b.Dy() == img.Height {
				sz = img.Height
			}

			var r io.Reader
			switch sz {
			case 25:
				r = bytes.NewReader(user.AvatarSet.Small.Bytes)
			case 50:
				r = bytes.NewReader(user.AvatarSet.Middle.Bytes)
			case 300:
				r = bytes.NewReader(user.AvatarSet.Large.Bytes)
			default:
				return fatalErrorf("想定していない画像サイズです")
			}

			im, _, err := image.Decode(r)
			if err != nil {
				return err
			}

			pixelsize := 1
			diff := 0.0
			for y := b.Min.Y; y < b.Max.Y; y += pixelsize {
				for x := b.Min.X; x < b.Max.X; x += pixelsize {
					diff += ciede2000.Diff(im.At(x, y), avatar.At(x, y))
				}
			}
			diff /= float64(b.Dx() * b.Dy())

			log.Println("DIFF:::::::", diff)
			if diff >= 0.15 {
				return fatalErrorf("画像の差分が閾値を超えました")
			}

			return nil
		},
	})
}

func genPostProfileBody(lastName, firstName, fileName string, avatar []byte, organizations []string) (*bytes.Buffer, string, error) {
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	if avatar != nil {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition",
			fmt.Sprintf(`form-data; name="%s"; filename="%s"`,
				escapeQuotes("icon"), escapeQuotes(fileName)))

		mt := MimeType(fileName)

		h.Set("Content-Type", mt)
		f, err := writer.CreatePart(h)
		if err != nil {
			return nil, "", err
		}
		if _, err := f.Write(avatar); err != nil {
			return nil, "", err
		}
	} else {
		if _, err := writer.CreateFormFile("icon", ""); err != nil {
			return nil, "", err
		}
	}

	if firstName != "" && lastName != "" {
		if err := writer.WriteField("last_name", lastName); err != nil {
			return nil, "", err
		}
		if err := writer.WriteField("first_name", firstName); err != nil {
			return nil, "", err
		}
	}

	for _, org := range organizations {
		writer.WriteField("organization", org)
	}

	if err := writer.Close(); err != nil {
		return nil, "", err
	}
	return body, writer.FormDataContentType(), nil
}

func checkRedirectStatusCode(res *http.Response, body *bytes.Buffer) error {
	if res.StatusCode == 302 || res.StatusCode == 303 {
		return nil
	}
	log.Println(body.String())
	return fmt.Errorf("期待していないステータスコード %d Expected 302 or 303", res.StatusCode)
}

func loadStaticFile(ctx context.Context, checker *Checker, path string) error {
	return checker.Play(ctx, &CheckAction{
		EnableCache:          true,
		SkipIfCacheAvailable: true,

		Method: "GET",
		Path:   path,
		CheckFunc: func(res *http.Response, body *bytes.Buffer) error {
			// Note. EnableCache時はPlay時に自動でResponseは最後まで読まれる
			if res.StatusCode == http.StatusOK {
				counter.IncKey("staticfile-200")
			} else if res.StatusCode == http.StatusNotModified {
				counter.IncKey("staticfile-304")
			} else {
				return fmt.Errorf("期待していないステータスコード %d", res.StatusCode)
			}
			return nil
		},
	})
}

func goLoadStaticFiles(ctx context.Context, checker *Checker, paths ...string) {
	for _, p := range paths {
		go loadStaticFile(ctx, checker, p)
	}
}

func goLoadAvatar(ctx context.Context, checker *Checker, paths ...string) {
	goLoadStaticFiles(ctx, checker, paths...)
}

func loginSuccessAction(user *AppUser) *CheckAction {
	return &CheckAction{
		Method:      "POST",
		Path:        "/login",
		CheckFunc:   checkRedirectStatusCode,
		Description: "ログインできること",
		PostData: map[string]string{
			"username": user.Name,
			"password": user.Password,
		},
	}
}

func logoutAction() *CheckAction {
	return &CheckAction{
		Method:      "GET",
		Path:        "/logout",
		CheckFunc:   checkRedirectStatusCode,
		Description: "ログアウトできること",
	}
}

func logout(ctx context.Context, checker *Checker, err *error) {
	e := checker.Play(ctx, logoutAction())
	if *err == nil {
		*err = e
	}
}

func getAttr(attrs []html.Attribute, key string) (string, bool) {
	for _, attr := range attrs {
		if attr.Key == key {
			return attr.Val, true
		}
	}
	return "", false
}

func IndexViewer(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	time.Sleep(time.Duration(rand.Intn(1000)) * time.Microsecond)
	getTicker := time.NewTicker(500 * time.Millisecond)
	defer getTicker.Stop()

	baseDate := time.Date(2017, 11, 1, 0, 0, 0, 0, time.UTC)
	ech := make(chan error, 1)
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-getTicker.C:
			go func() {
				date := baseDate.AddDate(0, 0, rand.Intn(150))

				var stylesheets []string
				var images []Image
				act := showIndexAction(user, &stylesheets, &images)
				act.Path += "?" + fmt.Sprintf("date=%d-%02d-%02d", date.Year(), date.Month(), date.Day())

				if err := checker.Play(ctx, act); err != nil {
					ech <- err
					return
				}

				for _, s := range stylesheets {
					if err := loadStaticFile(ctx, checker, s); err != nil {
						ech <- err
						return
					}
				}

				for _, img := range images {
					if err := loadStaticFile(ctx, checker, img.URL); err != nil {
						ech <- err
						return
					}
				}
			}()
		case e := <-ech:
			if e != nil {
				return e
			}
		}
	}
}

func showIndexAction(user *AppUser, stylesheets *[]string, images *[]Image) *CheckAction {
	return &CheckAction{
		Method:             "GET",
		Path:               "/",
		ExpectedStatusCode: 200,
		Description:        "トップページが表示できること",
		CheckFunc: checkHTML(func(response *http.Response, document *goquery.Document) error {
			for _, node := range document.Find(`link[rel="stylesheet"]`).Nodes {
				for _, attr := range node.Attr {
					if attr.Key != "href" {
						continue
					}
					*stylesheets = append(*stylesheets, attr.Val)
				}
			}

			for _, node := range document.Find("img").Nodes {
				uri, exists := getAttr(node.Attr, "src")
				if !exists {
					return fatalErrorf("imgタグが壊れています")
				}
				widthStr, exists := getAttr(node.Attr, "width")
				if !exists {
					return fatalErrorf("imgタグが壊れています")
				}
				heightStr, exists := getAttr(node.Attr, "height")
				if !exists {
					return fatalErrorf("imgタグが壊れています")
				}
				width, err := strconv.Atoi(widthStr)
				if err != nil {
					return fatalErrorf("imgタグが壊れています")
				}
				height, err := strconv.Atoi(heightStr)
				if err != nil {
					return fatalErrorf("imgタグが壊れています")
				}
				*images = append(*images, Image{Width: width, Height: height, URL: uri})
			}
			return nil
		}),
	}
}

var quoteEscaper = strings.NewReplacer("\\", "\\\\", `"`, "\\\"")

func escapeQuotes(s string) string {
	return quoteEscaper.Replace(s)
}

func registerSuccessAction(user *AppUser) (*CheckAction, error) {

	b := new(bytes.Buffer)
	w := multipart.NewWriter(b)
	var err error
	wf := func(fieldname, value string) {
		if err != nil {
			return
		}
		if werr := w.WriteField(fieldname, value); werr != nil {
			err = werr
		}
	}

	wf("username", user.Name)
	wf("password", user.Password)
	wf("first_name", user.FirstName)
	wf("last_name", user.LastName)
	for _, org := range user.Organizations {
		wf("organization", org)
	}
	if err != nil {
		return nil, err
	}

	if user.AvatarSet != nil {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition",
			fmt.Sprintf(`form-data; name="%s"; filename="%s"`,
				escapeQuotes("icon"), escapeQuotes(filepath.Base(user.AvatarSet.Origin.FilePath))))

		mt := MimeType(user.AvatarSet.Origin.FilePath)

		h.Set("Content-Type", mt)
		f, err := w.CreatePart(h)
		if err != nil {
			return nil, err
		}
		if _, err := f.Write(user.AvatarSet.Origin.Bytes); err != nil {
			return nil, err
		}
	} else {
		if _, err := w.CreateFormFile("icon", ""); err != nil {
			return nil, err
		}
	}

	if err := w.Close(); err != nil {
		return nil, err
	}

	return &CheckAction{
		Method:      "POST",
		Path:        "/register",
		CheckFunc:   checkRedirectStatusCode,
		ContentType: w.FormDataContentType(),
		PostBody:    b,
		Description: "新規ユーザが作成できること",
	}, nil
}

func LoadIndex(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	var stylesheets []string
	var images []Image
	if err := checker.Play(ctx, showIndexAction(user, &stylesheets, &images)); err != nil {
		return err
	}

	if len(stylesheets) > 4 {
		stylesheets = stylesheets[:4]
	}
	for _, stylesheet := range stylesheets {
		if err := loadStaticFile(ctx, checker, stylesheet); err != nil {
			return err
		}
	}

	for _, img := range images {
		if err := loadStaticFile(ctx, checker, img.URL); err != nil {
			return err
		}
	}

	return nil
}

func LoadRegister(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopNewUser()
	if user == nil {
		return nil
	}
	act, err := registerSuccessAction(user)
	if err != nil {
		return err
	}
	if err := checker.Play(ctx, act); err != nil {
		return err
	}
	defer func() {
		if err == nil {
			push()
		}
	}()
	defer logout(ctx, checker, &err)

	user.AvatarSet = DataSet.Avatars[rand.Intn(len(DataSet.Avatars))]

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition",
		fmt.Sprintf(`form-data; name="%s"; filename="%s"`,
			escapeQuotes("icon"), escapeQuotes(filepath.Base(user.AvatarSet.Origin.FilePath))))

	mt := MimeType(user.AvatarSet.Origin.FilePath)

	h.Set("Content-Type", mt)
	f, err := writer.CreatePart(h)
	if err != nil {
		return err
	}
	if _, err := f.Write(user.AvatarSet.Origin.Bytes); err != nil {
		return err
	}

	if err := writer.WriteField("first_name", user.FirstName); err != nil {
		return err
	}
	if err := writer.WriteField("last_name", user.LastName); err != nil {
		return err
	}
	orgs := []string{"1", "2", "3", "4", "5"}
	for _, org := range orgs {
		writer.WriteField("organization", org)
	}

	if err := writer.Close(); err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method:      "POST",
		Path:        "/users/",
		ContentType: writer.FormDataContentType(),
		PostBody:    body,
		CheckFunc:   checkRedirectStatusCode,
		Description: "プロフィールを変更できること",
	}); err != nil {
		return err
	}
	return nil
}

func LoadProfile(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	user2, _, push2 := state.PopRandomUser()
	if user2 == nil {
		return nil
	}
	defer push2()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/users/%s", user.Name),
		ExpectedStatusCode: 200,
		Description:        "プロフィールが表示できること",
	}); err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/users/%s", user2.Name),
		ExpectedStatusCode: 200,
		Description:        "他人のプロフィールが表示できること",
		CheckFunc: checkHTML(func(response *http.Response, doc *goquery.Document) error {
			sel := doc.Find(".container > div > div:nth-child(3) > img")

			avatarURL, exists := sel.Attr("src")
			if !exists {
				return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", user2.Name)
			}
			widthStr, exists := sel.Attr("width")
			if !exists {
				return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", user2.Name)
			}
			heightStr, exists := sel.Attr("height")
			if !exists {
				return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", user2.Name)
			}
			width, err := strconv.Atoi(widthStr)
			if err != nil {
				return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", user2.Name)
			}
			height, err := strconv.Atoi(heightStr)
			if err != nil {
				return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", user2.Name)
			}

			img := Image{
				Height: height,
				Width:  width,
				URL:    avatarURL,
			}

			if err := loadStaticFile(ctx, checker, img.URL); err != nil {
				return err
			}
			return nil
		}),
	}); err != nil {
		return err
	}

	return nil
}

func LoadReservation(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	if err := writer.WriteField("first_name", user.FirstName); err != nil {
		return err
	}
	if err := writer.WriteField("last_name", user.LastName); err != nil {
		return err
	}

	orgs := []string{"1", "2", "3", "4", "5"}
	for _, org := range orgs {
		writer.WriteField("organization", org)
	}
	if err := writer.Close(); err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method:      "POST",
		Path:        "/users/",
		ContentType: writer.FormDataContentType(),
		PostBody:    body,
		CheckFunc:   checkRedirectStatusCode,
		Description: "プロフィールを変更できること",
	}); err != nil {
		return err
	}

	year := "2017"
	month := strconv.Itoa(int(rand.Int31n(8) + 1))
	if len(month) == 1 {
		month = "0" + month
	}
	day := strconv.Itoa(int(rand.Int31n(27) + 1))
	if len(day) == 1 {
		day = "0" + day
	}
	date := year + "-" + month + "-" + day
	hour := strconv.Itoa(int(rand.Int31n(23-8) + 8))
	if len(hour) == 1 {
		hour = "0" + hour
	}
	start := hour + ":00"
	end := hour + ":30"

	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/reservations?room_id=5&date=" + date + "&start=" + start),
		ExpectedStatusCode: http.StatusOK,
		Description:        "予約されていないページがちゃんと見れること",
	}); err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method: "POST",
		Path:   fmt.Sprintf("/reservations"),
		PostData: map[string]string{
			"room_id": "5",
			"date":    date,
			"start":   start,
			"end":     end,
			"title":   "かいぎかいぎだっぜ",
		},
		CheckFunc: func(response *http.Response, buffer *bytes.Buffer) error {
			err := checkRedirectStatusCode(response, buffer)
			if err != nil {
				return err
			}

			redirectTo := response.Header.Get("Location")
			stylesheets := []string{}
			images := []Image{}
			action := showIndexAction(user, &stylesheets, &images)
			action.Path = redirectTo
			action.CheckFunc = checkHTML(func(response *http.Response, document *goquery.Document) error {
				active := document.Find(".active")
				actualStart, _ := active.Attr("data-start")
				actualEnd, _ := active.Attr("data-end")
				if actualStart != start+":00" {
					return fatalErrorf("Start time is not match actual %s, expected %s", actualStart, start+":00")
				}
				if actualEnd != end+":00" {
					return fatalErrorf("End time is not match actual %s, expected %s", actualEnd, end+":00")
				}

				actualUser := document.Find(fmt.Sprintf(`.active > a[href="/users/%s"]`, user.Name))
				if len(actualUser.Nodes) == 0 {
					return fatalErrorf("User is not %s", user.Name)
				}
				return nil
			})
			err = checker.Play(ctx, action)
			if err != nil {
				return err
			}
			if len(stylesheets) > 4 {
				stylesheets = stylesheets[:4]
			}
			for _, stylesheet := range stylesheets {
				if err := loadStaticFile(ctx, checker, stylesheet); err != nil {
					return err
				}
			}

			for _, img := range images {
				if err := loadStaticFile(ctx, checker, img.URL); err != nil {
					return err
				}
			}

			return nil

		},
		Description: "予約ができること",
	}); err != nil {
		return err
	}
	return nil
}

func CheckIndex(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	var stylesheets []string
	var images []Image
	if err := checker.Play(ctx, showIndexAction(user, &stylesheets, &images)); err != nil {
		return err
	}

	if len(stylesheets) > 4 {
		stylesheets = stylesheets[:4]
	}
	for _, stylesheet := range stylesheets {
		if err := loadStaticFile(ctx, checker, stylesheet); err != nil {
			return err
		}
	}
	for _, img := range images {
		if err := checkAvatar(ctx, checker, user, &img); err != nil {
			return err
		}
	}

	return nil
}

func CheckLogin(ctx context.Context, state *State) error {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()

	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}

	if err := checker.Play(ctx, logoutAction()); err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method:             "POST",
		Path:               "/login",
		ExpectedStatusCode: http.StatusBadRequest,
		PostData: map[string]string{
			"username": RandomAlphabetString(32),
			"password": RandomAlphabetString(32),
		},
		Description: "存在しないユーザでログインできないこと",
	}); err != nil {
		return err
	}

	return nil
}

func CheckReservation(ctx context.Context, state *State) (err error) {
	user, ok := state.FindUserByName("yoshioka_yuu")
	if !ok {
		return fmt.Errorf("Not Found user")
	}
	checker := state.GetChecker(user)
	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)
	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/reservations?room_id=11&date=2018-03-20&start=08:30"),
		ExpectedStatusCode: http.StatusOK,
		Description:        "予約されていないページがちゃんと見れること",
	}); err != nil {
		return err
	}
	if err := checker.Play(ctx, &CheckAction{
		Method: "POST",
		Path:   fmt.Sprintf("/reservations"),
		PostData: map[string]string{
			"room_id": "11",
			"date":    "2018-03-20",
			"start":   "08:30",
			"end":     "09:00",
			"title":   "Check会議",
		},
		CheckFunc:   checkRedirectStatusCode,
		Description: "予約されていないページが予約できること",
	}); err != nil {
		return err
	}
	if err := checker.Play(ctx, &CheckAction{
		Method: "POST",
		Path:   fmt.Sprintf("/reservations"),
		PostData: map[string]string{
			"room_id": "11",
			"date":    "2018-03-20",
			"start":   "08:00",
			"end":     "09:30",
			"title":   "Check会議",
		},
		ExpectedStatusCode: http.StatusForbidden,
		Description:        "既に予約済みの時間がある場合は予約できないこと",
	}); err != nil {
		return err
	}
	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/reservations?room_id=1&date=2018-03-20&start=08:30"),
		ExpectedStatusCode: http.StatusForbidden,
		Description:        "予約できない部屋は表示できないこと",
	}); err != nil {
		return err
	}
	return nil
}

func CheckGetProfileFail(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopRandomUser()
	if user == nil {
		return nil
	}
	defer push()
	if err := checker.Play(ctx, loginSuccessAction(user)); err != nil {
		return err
	}
	defer logout(ctx, checker, &err)

	if err := checker.Play(ctx, &CheckAction{
		Method:             "GET",
		Path:               fmt.Sprintf("/users/%s", RandomAlphabetString(32)),
		ExpectedStatusCode: http.StatusNotFound,
		Description:        "存在しないユーザのプロフィールはNotFoundが返ること",
	}); err != nil {
		return err
	}

	return nil
}

func CheckRegisterProfile(ctx context.Context, state *State) (err error) {
	user, checker, push := state.PopNewUser()
	if user == nil {
		return nil
	}

	user2, checker2, push2 := state.PopRandomUser()
	if user2 == nil {
		return nil
	}
	defer push2()

	if err := checker.Play(ctx, &CheckAction{
		Method:             "POST",
		Path:               "/login",
		ExpectedStatusCode: http.StatusBadRequest,
		PostData: map[string]string{
			"username": user.Name,
			"password": user.Password,
		},
		Description: "登録前のユーザでログインできないこと",
	}); err != nil {
		return err
	}

	act, err := registerSuccessAction(user)
	if err != nil {
		return err
	}
	if err := checker.Play(ctx, act); err != nil {
		return err
	}
	defer push()
	defer logout(ctx, checker, &err)

	if err := checker.Play(ctx, &CheckAction{
		Method:             "POST",
		Path:               "/register",
		ExpectedStatusCode: http.StatusForbidden,
		PostData: map[string]string{
			"username":     user.Name,
			"password":     user.Password + "Hoge",
			"first_name":   user.FirstName,
			"last_name":    user.LastName,
			"organization": "1",
		},
		Description: "登録済のユーザ名が使えないこと",
	}); err != nil {
		return err
	}
	if err := checker2.Play(ctx, loginSuccessAction(user2)); err != nil {
		return err
	}
	defer logout(ctx, checker2, &err)

	checkSelfProfile := func(name, lastName, firstName string) error {
		return checker.Play(ctx, &CheckAction{
			Method:             "GET",
			Path:               fmt.Sprintf("/users/%s", name),
			ExpectedStatusCode: 200,
			Description:        "プロフィールが表示できること",
			CheckFunc: checkHTML(func(res *http.Response, doc *goquery.Document) error {
				if v, _ := doc.Find("#last_name").Attr("value"); v != lastName {
					return fatalErrorf("自分のプロフィール画面にユーザ名が正しく表示されていません ユーザ名 %s", name)
				}
				if v, _ := doc.Find("#first_name").Attr("value"); v != firstName {
					return fatalErrorf("自分のプロフィール画面にユーザ名が正しく表示されていません ユーザ名 %s", name)
				}
				return nil
			}),
		})
	}

	checkOtherProfile := func(name, lastName, firstName string) error {
		return checker2.Play(ctx, &CheckAction{
			Method:             "GET",
			Path:               fmt.Sprintf("/users/%s", name),
			ExpectedStatusCode: 200,
			Description:        "他人のプロフィールが表示できること",
			CheckFunc: checkHTML(func(res *http.Response, doc *goquery.Document) error {
				if doc.Find(".container > div > div:nth-child(1)").Text() != lastName {
					return fatalErrorf("他人のプロフィール画面にユーザ名が正しく表示されていません ユーザ名 %s", name)
				}
				if doc.Find(".container > div > div:nth-child(2)").Text() != firstName {
					return fatalErrorf("他人のプロフィール画面にユーザ名が正しく表示されていません ユーザ名 %s", name)
				}
				sel := doc.Find(".container > div > div:nth-child(3) > img")

				img, exists := sel.Attr("src")
				if !exists {
					return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", name)
				}
				widthStr, exists := sel.Attr("width")
				if !exists {
					return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", name)
				}
				heightStr, exists := sel.Attr("height")
				if !exists {
					return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", name)
				}
				width, err := strconv.Atoi(widthStr)
				if err != nil {
					return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", name)
				}
				height, err := strconv.Atoi(heightStr)
				if err != nil {
					return fatalErrorf("他人のプロフィール画面に画像が正しく表示されていません ユーザ名 %s", name)
				}

				if err := checkAvatar(ctx, checker2, user, &Image{URL: img, Width: width, Height: height}); err != nil {
					return err
				}

				return nil
			}),
		})
	}

	// Note. デフォルトでは ユーザ名 = 表示名
	if err := checkSelfProfile(user.Name, user.LastName, user.FirstName); err != nil {
		return err
	}

	if err := checkOtherProfile(user.Name, user.LastName, user.FirstName); err != nil {
		return err
	}

	user.AvatarSet = DataSet.Avatars[rand.Intn(len(DataSet.Avatars))]

	body, ctype, err := genPostProfileBody(user.LastName, user.FirstName, user.AvatarSet.Origin.FilePath, user.AvatarSet.Origin.Bytes, user.Organizations)
	if err != nil {
		return err
	}

	if err := checker.Play(ctx, &CheckAction{
		Method:      "POST",
		Path:        "/users/",
		ContentType: ctype,
		PostBody:    body,
		CheckFunc:   checkRedirectStatusCode,
		Description: "プロフィールを変更できること",
	}); err != nil {
		return err
	}
	if err := checkSelfProfile(user.Name, user.LastName, user.FirstName); err != nil {
		return err
	}
	if err := checkOtherProfile(user.Name, user.LastName, user.FirstName); err != nil {
		return err
	}
	return nil
}
