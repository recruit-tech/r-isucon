const Client = require('../client/Client');

exports.gotoIndex = async () => {
  const client = await Client.createClient();
  await client.goto('/');
};

exports.searchRoom = async (date) => {
  const client = await Client.createClient();
  const { page } = client;
  const $date = await page.$('input[type="date"]')
  await $date.type(date)
  const $submit = await page.$('input[type="submit"]')
  await $submit.click()
  await page.waitForNavigation()
};

