-- Communications Application: MySQL schema.
-- Run once:  mysql -u root -p < schema.sql
-- (Flask can also create the tables itself: flask --app app init-db)

CREATE DATABASE IF NOT EXISTS communications_app
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dedicated app user. Change the password and keep it in backend/.env
CREATE USER IF NOT EXISTS 'comms_user'@'localhost' IDENTIFIED BY 'comms_password';
GRANT ALL PRIVILEGES ON communications_app.* TO 'comms_user'@'localhost';
FLUSH PRIVILEGES;

USE communications_app;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  body       VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  owner_id    INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  file_name   VARCHAR(255) NOT NULL,   -- display name only (secure_filename)
  stored_name VARCHAR(64)  NOT NULL,   -- random name on disk
  size        INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shares (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id     INT NOT NULL,
  UNIQUE KEY uq_share (document_id, user_id),
  CONSTRAINT fk_shares_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_shares_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
);
