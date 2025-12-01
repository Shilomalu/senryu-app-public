-- --------------------------------------------------
-- 1. データベースとユーザーのセットアップ
-- (以前確定させた接続情報に一致させています)
-- --------------------------------------------------

-- sqlを起動する際は
-- 「mysql -u root -p --default-character-set=utf8mb4」
-- 下の文を表示するとデータベースを削除して再作成
-- DROP DATABASE IF EXISTS Project_Team6_db;

CREATE DATABASE IF NOT EXISTS Project_Team6_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE Project_Team6_db;

-- 既存のユーザーがいるとエラーになる場合があるため、一度安全に削除してから作成します
DROP USER IF EXISTS 'Project_Team6_user'@'localhost';
CREATE USER 'Project_Team6_user'@'localhost' IDENTIFIED BY 'Project_Team6_pw';

GRANT ALL PRIVILEGES ON Project_Team6_db.* TO 'Project_Team6_user'@'localhost';

FLUSH PRIVILEGES;


-- --------------------------------------------------
-- 2. テーブル構造の作成
-- (いいね、フォロー、リプライを含む全機能対応版)
-- --------------------------------------------------

DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS replies;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS dictionary;
DROP TABLE IF EXISTS directmessages;
DROP TABLE IF EXISTS topic_master;
DROP TABLE IF EXISTS weekly_themes;
DROP TABLE IF EXISTS ranking_results;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_text VARCHAR(255) DEFAULT 'よろしくお願いします。' ,
    favorite_id INT NULL,
    icon_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ジャンルテーブルの作成
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

INSERT INTO genres (name) VALUES
('春'),('夏'),('秋'),('冬'),('趣味'),('食べ物'),('学校'),('その他');

-- postsの中に格納しました.
-- posts テーブルに genre_id を追加
-- ALTER TABLE posts
-- ADD COLUMN genre_id INT NOT NULL DEFAULT 1;

-- 外部キーの設定
-- ALTER TABLE posts
-- ADD CONSTRAINT fk_posts_genre
-- FOREIGN KEY (genre_id) REFERENCES genres(id);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content VARCHAR(100) NOT NULL,
    ruby_content JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    likes_num INT DEFAULT 0,
    genre_id INT NOT NULL DEFAULT 1,
    weekly_theme_id INT NULL;

    CONSTRAINT fk_posts_genre
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

CREATE TABLE likes (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE follows (
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    content VARCHAR(280) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE topic_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(50) NOT NULL
);

INSERT INTO topic_master (theme_name) VALUES 
('春'), ('夏'), ('秋'), ('冬'), 
('猫'), ('推し'), ('卒業'), ('夜食');

CREATE TABLE weekly_themes (
    id INT AUTO_INCREMENT PRIMARY KEY, -- これが「開催ID」になる
    topic_id INT NOT NULL,             -- お題マスタのID
    start_date DATE NOT NULL,          -- 開始日 (例: 2025-12-01)
    end_date DATE NOT NULL,            -- 終了日 (例: 2025-12-07)
    FOREIGN KEY (topic_id) REFERENCES topic_master(id)
);

CREATE TABLE IF NOT EXISTS ranking_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weekly_theme_id INT NOT NULL,  -- 第○回のランキングか
    post_id INT NOT NULL,          -- ランクインした投稿ID
    rank INT NOT NULL,             -- 順位 (1, 2, ... 10)
    fixed_likes_count INT NOT NULL,-- ★確定時のいいね数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (weekly_theme_id) REFERENCES weekly_themes(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE dictionary(
    id INT AUTO_INCREMENT PRIMARY KEY,
    word_id INT NOT NULL,
    word VARCHAR(10) NOT NULL,
    sennryuu_id INT NOT NULL
);

CREATE TABLE directmessages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reply_77 BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
