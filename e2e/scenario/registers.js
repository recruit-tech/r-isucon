const Client = require('../client/Client');
const scenario = {
  names: {},
  list: () => Object.keys(scenario.names),
};

scenario.names["register logout login"] = async function() {
  const client = await Client.createClient();
  const path = "register_logout_login";
  console.log(path);
  const register = require('../operations/register');
  const login = require('../operations/login');
  const logout = require('../operations/logout');
  await register.gotoRegister();
  await register.doRegister({
    username: "yosuke_furukawa",
    password: "furukawa",
    firstName: "Yosuke",
    lastName: "Furukawa",
    icon: "./wall-e.jpg",
    organizations: [1,2,3,4]
  });
  await client.page.screenshot({ path: `./images/${client.label}/${path}/register.png` });
};

module.exports = scenario;
