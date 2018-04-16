const Client = require('../client/Client');
const scenario = {
  names: {},
  list: () => Object.keys(scenario.names),
};

scenario.names["login_and_goto_top_and_logout"] = async function() {
  const path = "login_and_goto_top_and_logout";
  console.log(path);
  const login = require('../operations/login');
  const logout = require('../operations/logout');
  await login.gotoLogin()
  const client = await Client.createClient();
  await client.page.screenshot({ path: `./images/${client.label}/${path}/login.png` });
  await login.doLogin("scott", "tiger")
  await client.page.screenshot({ path: `./images/${client.label}/${path}/top.png` });
  await logout.gotoLogout()
  await client.page.screenshot({ path: `./images/${client.label}/${path}/logout.png` });
};

scenario["login and goto top and logout"] = async function() {
  console.log("login and goto top and logout");
  const login = require('../operations/login');
  const logout = require('../operations/logout');
  await login.gotoLogin()
  const client = await Client.createClient();
  await client.page.screenshot({ path: "./images/${client.label}/${path}/login.png" });
  await login.doLogin("scott", "tiger")
  await client.page.screenshot({ path: "./images/${client.label}/${path}/top.png" });
  await logout.gotoLogout()
  await client.page.screenshot({ path: "./images/${client.label}/${path}/logout.png"});
};

module.exports = scenario;