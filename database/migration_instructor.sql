-- Migration for Instructor Subsystem (Phân hệ Giảng viên)
-- Bao gom: Subjects, Topics, Question Options, Quizzes, Quiz Questions

USE quiz_system;

-- 1. Subjects table (Mon hoc)
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Topics table (Chu de)
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Question Options (Cac phuong an lua chon & giai thich cho cau hoi)
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    explanation TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 4. Quizzes (De thi)
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

-- 5. Quiz Questions (Danh sach cau hoi thuoc de thi)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    order_index INT DEFAULT 0,
    score_weight DECIMAL(4,2) DEFAULT 1.0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Seed data for Subjects
INSERT INTO subjects (name, code, description)
SELECT 'Web Development', 'SWE102', 'Foundations of HTML, CSS, JavaScript'
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'SWE102');

INSERT INTO subjects (name, code, description)
SELECT 'Software Architecture and Design', 'SWD392', 'Principles of software architecture and patterns'
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'SWD392');

-- Seed data for Topics
INSERT INTO topics (subject_id, name, description)
SELECT 1, 'HTML & CSS Basics', 'Basic web markup and styling'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE name = 'HTML & CSS Basics');

INSERT INTO topics (subject_id, name, description)
SELECT 1, 'ReactJS & State Management', 'Components, hooks, props'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE name = 'ReactJS & State Management');

-- Seed sample options for existing questions
INSERT INTO question_options (question_id, option_text, is_correct, explanation)
SELECT 1, 'HyperText Markup Language', 1, 'HTML stands for HyperText Markup Language.'
WHERE NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = 1 AND option_text LIKE 'HyperText%');

INSERT INTO question_options (question_id, option_text, is_correct, explanation)
SELECT 1, 'HighText Machine Language', 0, 'Incorrect abbreviation.'
WHERE NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = 1 AND option_text LIKE 'HighText%');

INSERT INTO question_options (question_id, option_text, is_correct, explanation)
SELECT 1, 'Hyperlink and Text Marking Language', 0, 'Incorrect abbreviation.'
WHERE NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = 1 AND option_text LIKE 'Hyperlink%');

INSERT INTO question_options (question_id, option_text, is_correct, explanation)
SELECT 2, 'A JavaScript library for building user interfaces', 1, 'React is a component-based frontend library developed by Meta.'
WHERE NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = 2 AND is_correct = 1);

INSERT INTO question_options (question_id, option_text, is_correct, explanation)
SELECT 2, 'A relational database management system', 0, 'React is not a database.'
WHERE NOT EXISTS (SELECT 1 FROM question_options WHERE question_id = 2 AND is_correct = 0);
