# Y!SUCON ポータル
## インストール
```
npm install -g yarn
yarn install
```

環境変数に以下の値を入れること
```
YJ_ISUCON_DB_HOST
YJ_ISUCON_DB_USER
YJ_ISUCON_DB_PASSWORD
YJ_ISUCON_DB_PORT
YJ_ISUCON_DB_NAME
YJ_ISUCON_SECRET_KEY
MYM_USER
MYM_PASS
```

## 開発時
```
npm run watch:dev
```

## 本番実行
```
# プロセス永続化
npm run start:prod

# 永続化プロセスの終了
npm run stop:prod
```

Angular2のAOTビルドはまだ使えません
