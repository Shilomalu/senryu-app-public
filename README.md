川柳SNS開発プロジェクト (Project_Team6)
このプロジェクトは、Vue.jsとNode.jsを使った川柳SNSアプリケーションを作成するためのものです。

1. 初回セットアップ
新しくプロジェクトに参加したメンバーは、最初に以下の手順を実行してください。

データベースの準備:

自分のPCにMySQLをインストールします。

MySQL Workbenchを使い、プロジェクトのdatabase/schema.sqlファイルを実行して、必要なテーブルとユーザーを作成します。

バックエンドの準備:

backendフォルダに移動し、.envファイルを作成します。(database/schema.sqlで設定したDB情報に合わせてください)

以下のコマンドを実行して、必要なライブラリをインストールします。

Bash

cd backend
npm install
フロントエンドの準備:

以下のコマンドを実行して、必要なライブラリをインストールします。

Bash

cd frontend
npm install
2. アプリケーションの実行方法
開発を始めるには、2つのターミナルを開き、それぞれで以下のサーバーを起動する必要があります。

フロントエンドサーバー
Bash

cd frontend
npm run dev
表示されたURL (http://localhost:5173など) をブラウザで開いてください。

バックエンドサーバー
Bash

cd backend
npm run dev
3. 開発のルールと流れ
毎日の作業フロー
pullする: 作業を始める前に、必ずGitHubの最新の変更を取り込みます。

Bash

git checkout main
git pull origin main
ブランチを切る: 自分の担当機能用のブランチを作成します。(例: feature/login-page)

Bash

git checkout -b [ブランチ名]
開発する: 自分のブランチでコーディングを行います。

pushする: 作業が終わったら、GitHubにプッシュします。

Bash

git add .
git commit -m "変更内容の要約"
git push origin [ブランチ名]
プルリクエストを作成: GitHub上でプルリクエストを作成し、レビューを依頼します。

🚨 注意事項
pushする前には、必ず自分のPCで動作確認をしてください。

mainブランチには直接pushしないでください。 必ずプルリクエストを使いましょう。

作業が終わったら、リーダーに進捗を報告してください。

4. コンポーネント一覧
views フォルダ (各ページ)
ファイル名	目的
TimelineView.vue	全員の投稿が流れるタイムライン（ホームページ）
RegisterView.vue	新規ユーザー登録ページ
LoginView.vue	ログインページ
CreatePostView.vue	新しい川柳を投稿するページ
PostDetailView.vue	投稿の詳細とリプライ一覧を表示するページ
ProfileView.vue	ユーザーのプロフィールと投稿一覧を表示するページ
SearchView.vue	キーワードで川柳を検索するページ
NotFoundView.vue	存在しないURLにアクセスした際に表示する404ページ

Google スプレッドシートにエクスポート
components フォルダ (再利用する部品)
ファイル名	目的
Header.vue	全ページ共通のヘッダーやナビゲーション
PostCard.vue	タイムラインに表示する、一つの投稿のカード
PostForm.vue	川柳を投稿するためのフォーム
LikeButton.vue	「いいね」のハートアイコンと数を表示するボタン
FollowButton.vue	ユーザーをフォローするためのボタン
ReplyCard.vue	投稿詳細ページに表示する、一つのリプライのカード
ReplyForm.vue	リプライを投稿するためのフォーム
