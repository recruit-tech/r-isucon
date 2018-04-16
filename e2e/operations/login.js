const Client = require('../client/Client');

exports.gotoLogin = async () => {
  const client = await Client.createClient();
  await client.goto('/login');
};

exports.doLogin = async (username, password) => {
  const client = await Client.createClient();
  const { page } = client;
  const $username = await page.$('#username');
  await $username.type(username);
  const $password = await page.$('#password');
  await $password.type(password);
  const $submit = await page.$('input[type="submit"]');
  await $submit.click();
  await page.waitForNavigation();
};