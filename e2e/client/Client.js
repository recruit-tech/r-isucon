const puppeteer = require('puppeteer');

class Client {
  static async createClient(domain, label) {
    console.log(domain)
    if (Client.instance) {
      console.log('instance found')
      return Client.instance;
    }
    console.log('instance not found')
    const client = new Client();
    client.domain = domain;
    client.browser = await puppeteer.launch();
    client.page = await client.browser.newPage();
    client.label = label;
    Client.instance = client;
    return client;
  }

  async goto(url) {
    this.url = `${this.domain}${url}`
    await this.page.goto(this.url)
  }

  async close() {
    if (!Client.instance) {
      throw new Error("call createClient first");
    }
    await this.browser.close();
  }
}

Client.instance = null;
module.exports = Client;