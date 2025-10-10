# Project_Team6
このプロジェクトは川柳SNSを作成するためのアプリケーションです、
#使い方
1. `backend`フォルダに移動して`npm install`を行う。
2. `frontend`フォルダに移動して`npm install`を行う。

作成したファイル、変更したファイルをプッシュする時の注意事項
　必ず自身のPC上で動くかどうかを確認してから、githubにプッシュしてください

プッシュする方法
自分のファイルを保存したうえで、プルを行う。
ターミナル上のfrontendフォルダーやbackendフォルダーが入っているディレクトリで「git add .」、「git commit -m 」、「git push origin main」を順番に実行する。
プルを行う前にプッシュをすると、エラーが発生する可能性がある。

バックエンドの扱う人用(できれば全員行う。もし行うことができれば実際に自分のパソコンで全体を確認できる。)
まず、最初に各PCに.envファイルを作成する
1.backendディレクトリに「.env」という名のファイルを作成する。
2.中身を「
PORT=3001
DB_HOST=localhost
DB_NAME=Project_Team6_db
DB_USER=Project_Team6_user
DB_PASSWORD=Project_Team6_pw
」をコピペして保存する。
次に以下の2つのソフトウェアをPCにインストールします。
1.
MySQL Community Server: データベース本体です。

MySQL Workbench: データベースをGUIで操作するための公式ツールです。

インストールの際は、rootユーザーのパスワードを設定する画面が表示されます。このパスワードは忘れないように必ずメモしてください。

2.実行：schema.sqlスクリプトの実行
次に、アプリケーションに必要なデータベース、専用ユーザー、テーブルを一度に作成します。

MySQL Workbenchを起動し、インストール時に設定したrootパスワードで接続します。

schema.sqlをドラッグする。

稲妻（⚡）ボタンを押して、スクリプト全体を実行します。

プルの方法
ターミナル上で「git checkout main」、「git pull origin main」を順に行う。
