const Client = require('../client/Client');
const assert = require('assert');

exports.gotoRegister = async () => {
  const client = await Client.createClient();
  await client.goto('/register');
  assert.strictEqual(client.page.url(), client.url)
};

exports.doRegister = async ({username, password, lastName, firstName, icon, organizations}) => {
  const client = await Client.createClient();
  const { page } = client;
  const $username = await page.$('#username');
  await $username.type(username);
  const $password = await page.$('#password');
  await $password.type(password);
  const $lastName = await page.$('#last_name');
  await $lastName.type(lastName);
  const $firstName = await page.$('#first_name');
  await $firstName.type(firstName);
  if (icon) {
    const $icon = await page.$('#icon');
    await $icon.uploadFile(icon);
  }


  for (const id of organizations) {
    await page.click(`input[value="${id}"]`);
  }
  const $submit = await page.$('input[type="submit"]');
  await $submit.click();
  await page.waitForNavigation();
 // assert.strictEqual(client.page.url(), `${client.domain}/`)
};
