export class Score {
  private date: Date;
  constructor(public score: number, public message: string, date: string) {
    this.date = new Date(date);
  }

  get localeDate() {
    return this.date.toLocaleString();
  }

  get unixtime() {
    return this.date.getTime();
  }

  isPass() {
    return this.score !== 0;
  }
}
