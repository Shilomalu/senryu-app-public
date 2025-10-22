-- --------------------------------------------------
-- 1. データベースとユーザーのセットアップ
-- (以前確定させた接続情報に一致させています)
-- --------------------------------------------------

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


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_text VARCHAR(255) DEFAULT 'よろしくお願いします。',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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