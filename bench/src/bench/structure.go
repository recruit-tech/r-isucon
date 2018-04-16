package bench

import (
	"math/rand"
	"sync"
)

type JsonUser struct {
	ID          int    `json:"id"`
	AvatarIcon  string `json:"avatar_icon"`
	DisplayName string `json:"display_name"`
	Name        string `json:"name"`
}

type AvatarSet struct {
	Origin *Avatar
	Small  *Avatar
	Middle *Avatar
	Large  *Avatar
}

type BenchDataSet struct {
	Users    []*AppUser
	NewUsers []*AppUser

	Avatars       []*AvatarSet
	DefaultAvatar *AvatarSet
}

type Avatar struct {
	FilePath string
	Ext      string
	Bytes    []byte
}

type AppUser struct {
	sync.Mutex
	Name          string
	Password      string
	LastName      string
	FirstName     string
	Organizations []string
	AvatarSet     *AvatarSet
}

type State struct {
	mtx        sync.Mutex
	users      []*AppUser
	newUsers   []*AppUser
	userMap    map[string]*AppUser
	checkerMap map[*AppUser]*Checker
}

func (s *State) Init() {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	s.users = append(s.users, DataSet.Users...)
	s.newUsers = append(s.newUsers, DataSet.NewUsers...)
	s.userMap = map[string]*AppUser{}
	s.checkerMap = map[*AppUser]*Checker{}

	for _, u := range DataSet.Users {
		s.userMap[u.Name] = u
	}
}

func (s *State) PopRandomUser() (*AppUser, *Checker, func()) {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	n := len(s.users)
	if n == 0 {
		return nil, nil, nil
	}

	i := rand.Intn(n)
	u := s.users[i]

	s.users[i] = s.users[n-1]
	s.users[n-1] = nil
	s.users = s.users[:n-1]

	return u, s.getCheckerLocked(u), func() { s.PushUser(u) }
}

func (s *State) FindUserByName(name string) (*AppUser, bool) {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	u, ok := s.userMap[name]
	return u, ok
}

func (s *State) popNewUserLocked() (*AppUser, *Checker, func()) {
	n := len(s.newUsers)
	if n == 0 {
		return nil, nil, nil
	}

	u := s.newUsers[n-1]
	s.newUsers = s.newUsers[:n-1]

	return u, s.getCheckerLocked(u), func() { s.PushUser(u) }
}

func (s *State) PopNewUser() (*AppUser, *Checker, func()) {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	return s.popNewUserLocked()
}

func (s *State) PushUser(u *AppUser) {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	s.userMap[u.Name] = u
	s.users = append(s.users, u)
}

func (s *State) GetChecker(u *AppUser) *Checker {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	return s.getCheckerLocked(u)
}

func (s *State) getCheckerLocked(u *AppUser) *Checker {
	checker, ok := s.checkerMap[u]

	if !ok {
		checker = NewChecker()
		checker.debugHeaders["X-Username"] = u.Name
		s.checkerMap[u] = checker
	}

	return checker
}
