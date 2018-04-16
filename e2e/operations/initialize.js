const Client = require('../client/Client');

exports.gotoInitialize = async () => {
  const client = await Client.createClient();
  await client.goto('/initialize');
};
