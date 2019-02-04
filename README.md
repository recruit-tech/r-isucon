# r-isucon
Recruit Technologies が主催と準備を行って開催した、R-ISUCONです。

## ローカル環境の立ち上げ方

### nodejs

makeコマンドで色々やります

* `make up`      : nodejs + mysqlのローカル環境を立ち上げます
* `make down`    : 環境を停止させます
* `make rm`      : コンテナの削除とmysqlボリュームの削除を行います
* `make buid/up` : コンテナのbuildと起動を行います

mysqlは middleware/tmp配下にデータを配置します。tmp以下の中身を消してコンテナを立ち上げ直せばクリーンな状態で再起動がされます。

### benchmark bootup

* `make data`    : resize済みの画像を生成します (pythonとimage magickに依存しています)
* `make build`   : benchmarkerをbuildします。bin/benchにbinaryが出力されます。
* `make run`     : bin/benchを実行します。localhost:3000に負荷をかけ始めます。

top levelに存在するdocker-compose.yamlを使った一連の流れ
```
docker-compose up -d --build
cd bench
make data
make build
make run
```

### レギュレーション

https://gist.github.com/yosuke-furukawa/d7c7b64ab1d1dc5ee5e65a7f7f806ab7

### 操作マニュアル

https://hackmd.io/s/Sya7gm5cG

### License

MIT

### Portal inspired by Y!ISUCON

https://github.com/yahoojapan/yisucon

### benchmark inspired by isucon7-qualify

https://github.com/isucon/isucon7-qualify/
