-- Migration for the instructor subsystem. Run after schema.sql on SQL Server.
USE quiz_system;
GO

-- 1. Subjects table (Mon hoc)
IF OBJECT_ID(N'dbo.subjects', N'U') IS NULL
CREATE TABLE dbo.subjects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- 2. Topics table (Chu de)
IF OBJECT_ID(N'dbo.topics', N'U') IS NULL
CREATE TABLE dbo.topics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Question Options (Cac phuong an lua chon & giai thich cho cau hoi)
IF OBJECT_ID(N'dbo.question_options', N'U') IS NULL
CREATE TABLE dbo.question_options (
    id INT IDENTITY(1,1) PRIMARY KEY,
    question_id INT NOT NULL,
    option_text NVARCHAR(MAX) NOT NULL,
    is_correct BIT NOT NULL DEFAULT 0,
    explanation NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 4. Quizzes (De thi)
IF OBJECT_ID(N'dbo.quizzes', N'U') IS NULL
CREATE TABLE dbo.quizzes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_id INT NULL,
    topic VARCHAR(100) DEFAULT 'General',
    duration_minutes INT NOT NULL DEFAULT 60,
    pass_score DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    shuffle_questions BIT NOT NULL DEFAULT 1,
    shuffle_options BIT NOT NULL DEFAULT 1,
    status NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- 5. Quiz Questions (Danh sach cau hoi thuoc de thi)
IF OBJECT_ID(N'dbo.quiz_questions', N'U') IS NULL
CREATE TABLE dbo.quiz_questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    order_index INT DEFAULT 0,
    score_weight DECIMAL(4,2) NOT NULL DEFAULT 1.0,
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
SELECT (SELECT TOP (1) id FROM subjects WHERE code = 'SWE102'), 'HTML & CSS Basics', 'Basic web markup and styling'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE name = 'HTML & CSS Basics');

INSERT INTO topics (subject_id, name, description)
SELECT (SELECT TOP (1) id FROM subjects WHERE code = 'SWE102'), 'ReactJS & State Management', 'Components, hooks, props'
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
