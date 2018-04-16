const Client = require('./client/Client');
const logins = require('./scenario/logins');
const registers = require('./scenario/registers');
const path = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'label_3000';

(async () => {
  const client = await Client.createClient(path, label);
  for (const scenario of logins.list()) {
    await logins.names[scenario]();
  }
  for (const scenario of registers.list()) {
    await registers.names[scenario]();
  }

  await client.close();
})();

process.on("unhandledRejection", (err) => {
  console.error(err)
  process.exit(1)
});

process.on("uncaughtException", (err) => {
  console.error(err)
  process.exit(1)
});
