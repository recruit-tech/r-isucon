export class Team {
  public members: Member[];

  constructor(public id: number, public name: string, members: {name: string}[], public host = '', public lang = '') {
    this.members = members.map((member) => {
      return new Member(member.name);
    });
  }

  countFreeMembers() {
    return 3 - this.members.length;
  }
}

class Member {
  constructor(public name: string) {}

  get icon() {
    // change here
    return 'https://s.yimg.jp/images/riff/3.10.0/images/icon/png/user_box.png';
  }
}
