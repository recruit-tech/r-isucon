const Client = require('../client/Client');

exports.gotoLogout = async () => {
  const client = await Client.createClient();
  await client.goto("/logout");
}
