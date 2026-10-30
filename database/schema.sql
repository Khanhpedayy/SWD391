CREATE DATABASE IF NOT EXISTS quiz_system;
USE quiz_system;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Easy',
    question_type ENUM('Single Choice', 'Multiple Choice', 'True/False') NOT NULL DEFAULT 'Single Choice',
    topic VARCHAR(100) NOT NULL DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO questions (content, difficulty, question_type, topic)
SELECT 'What does HTML stand for?', 'Easy', 'Single Choice', 'Web Development'
WHERE NOT EXISTS (SELECT 1 FROM questions);

INSERT INTO questions (content, difficulty, question_type, topic)
SELECT 'What is React used for?', 'Medium', 'Single Choice', 'ReactJS'
WHERE (SELECT COUNT(*) FROM questions) = 1;

-- 1. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Topics table
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Question Options (Options & Explanations)
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    explanation TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 4. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_id INT NULL,
    topic VARCHAR(100) DEFAULT 'General',
    duration_minutes INT NOT NULL DEFAULT 60,
    pass_score DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    shuffle_questions TINYINT(1) DEFAULT 1,
    shuffle_options TINYINT(1) DEFAULT 1,
    status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- 5. Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    order_index INT DEFAULT 0,
    score_weight DECIMAL(4,2) DEFAULT 1.0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
