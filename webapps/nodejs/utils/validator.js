exports.validateOrganizations = orgs => {
  if (!Array.isArray(orgs)) {
    return "組織が選択されていません。";
  } else if (!orgs.length) {
    return "組織が選択されていません。";
  }
};

exports.validateUsername = username => {
  if (!username) {
    return "ユーザ名がありません。";
  } else if (username.length < 5 || username.length > 30) {
    return "ユーザ名は5文字以上30文字以下にしてください。";
  } else if (!username.match(/^[a-z0-9_]+$/i)) {
    return "ユーザ名はアルファベットか数字にしてください。";
  }
};

exports.validatePassword = (password, username) => {
  if (!password) {
    return "パスワードがありません。";
  } else if (password.length < 5 || password.length > 30) {
    return "パスワードは5文字以上30文字以下にしてください。";
  } else if (!password.match(/^[a-z0-9_]+$/i)) {
    return "パスワードはアルファベットか数字にしてください。";
  } else if (username.includes(password)) {
    return "パスワードにはユーザ名を含めないでください。";
  }
};
