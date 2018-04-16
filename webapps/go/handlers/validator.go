package handlers

import (
	"regexp"
	"strings"
)

func ValidateOrganizations(orgs []string) string {
	if len(orgs) == 0 {
		return "組織が選択されていません。"
	}
	return ""
}

func ValidateUsername(username string) string {
	r := regexp.MustCompile(`^[a-zA-Z0-9_]+$]`)
	if username == "" {
		return "ユーザ名がありません。"
	} else if len(username) < 5 || len(username) > 30 {
		return "ユーザ名は5文字以上30文字以下にしてください。"
	} else if r.MatchString(username) {
		return "ユーザ名はアルファベットか数字にしてください。"
	}
	return ""
}

func ValidatePassword(password string, username string) string {
	r := regexp.MustCompile(`^[a-zA-Z0-9_]+$]`)
	if password == "" {
		return "パスワードがありません。"
	} else if len(password) < 5 || len(password) > 30 {
		return "パスワードは5文字以上30文字以下にしてください。"
	} else if r.MatchString(password) {
		return "パスワードはアルファベットか数字にしてください。"
	} else if strings.Index(username, password) >= 0 {
		return "パスワードにはユーザ名を含めないでください。"
	}
	return ""
}
