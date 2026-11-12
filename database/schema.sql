IF DB_ID(N'quiz_system') IS NULL
    EXEC(N'CREATE DATABASE quiz_system');
GO
USE quiz_system;
GO

IF OBJECT_ID(N'dbo.questions', N'U') IS NULL
CREATE TABLE dbo.questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    difficulty NVARCHAR(20) NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_type NVARCHAR(30) NOT NULL DEFAULT 'Single Choice' CHECK (question_type IN ('Single Choice', 'Multiple Choice', 'True/False')),
    topic VARCHAR(100) NOT NULL DEFAULT 'General',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

INSERT INTO questions (content, difficulty, question_type, topic)
SELECT 'What does HTML stand for?', 'Easy', 'Single Choice', 'Web Development'
WHERE NOT EXISTS (SELECT 1 FROM questions);

INSERT INTO questions (content, difficulty, question_type, topic)
SELECT 'What is React used for?', 'Medium', 'Single Choice', 'ReactJS'
WHERE (SELECT COUNT(*) FROM questions) = 1;

-- 1. Subjects table
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

-- 2. Topics table
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

-- 3. Question Options (Options & Explanations)
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

-- 4. Quizzes
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

-- 5. Quiz Questions
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
