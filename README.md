# Project_Team6

このプロジェクトは川柳SNSを作成するためのアプリケーションです、
   
    #使い方
    1. `backend`フォルダに移動して`npm install`を行う。
    2. `frontend`フォルダに移動して`npm install`を行う。
    3.　終わったら必ず何をしたかを僕に教えて

作成したファイル、変更したファイルをプッシュする時の注意事項

    必ず自身のPC上で動くかどうかを確認してから、githubにプッシュしてください

プッシュする方法

    自分のファイルを保存したうえで、プルを行う。
    ターミナル上のfrontendフォルダーやbackendフォルダーが入っているディレクトリで「git add .」、「git commit -m 」、「git push origin main」を順番に実行する。
    プルを行う前にプッシュをすると、エラーが発生する可能性がある。

1.フロントエンド実行方法
    
    「cd frontend」、「npm run dev」
2.バックエンド実行方法

    「cd frontend」、「npm run dev」

プルの方法
    
    ターミナル上で「git checkout main」、「git pull origin main」を順に行う。

ファイル使用用途一覧

    TimelineView.vue	全員の投稿が流れるタイムライン（ホームページ）
    RegisterView.vue	新規ユーザー登録ページ
    LoginView.vue	ログインページ
    CreatePostView.vue	新しい川柳を投稿するページ
    PostDetailView.vue	投稿の詳細とリプライ（返信）一覧を表示するページ
    ProfileView.vue	ユーザーのプロフィールと投稿一覧を表示するページ
    SearchView.vue	キーワードで川柳を検索するページ
    NotFoundView.vue	存在しないURLにアクセスした際に表示する404ページ
    
    
    Header.vue	全ページ共通のヘッダーやナビゲーション
    PostCard.vue	タイムラインに表示する、一つの投稿（内容、作者、いいねボタンなど）のカード
    PostForm.vue	川柳を投稿するためのフォーム（CreatePostViewなどで使用）
    LikeButton.vue	「いいね」のハートアイコンと、いいね数を表示するボタン
    FollowButton.vue	ユーザーをフォローするためのボタン（ProfileViewなどで使用）
    ReplyCard.vue	投稿詳細ページに表示する、一つのリプライのカード
    ReplyForm.vue	リプライを投稿するためのフォーム


