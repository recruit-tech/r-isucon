const Client = require('../client/Client');

exports.gotoUser = async (user) => {
  const client = await Client.createClient();
  await client.goto(`/users/${user}`);
};

exports.editUser = async (user) => {
  const client = await Client.createClient();
  await client.goto(`/users/${user}`);
};
