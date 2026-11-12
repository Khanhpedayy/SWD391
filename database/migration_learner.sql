-- Migration for the learner quiz practice module. Run after migration_instructor.sql on SQL Server.
USE quiz_system;
GO

IF OBJECT_ID(N'dbo.quiz_attempts', N'U') IS NULL
CREATE TABLE dbo.quiz_attempts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    quiz_id INT NOT NULL,
    learner_key VARCHAR(64) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'InProgress' CHECK (status IN ('InProgress', 'Submitted')),
    score DECIMAL(5,2) NULL,
    passed BIT NULL,
    question_order NVARCHAR(MAX) NULL,
    option_order NVARCHAR(MAX) NULL,
    started_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    submitted_at DATETIME2 NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_attempts_learner_quiz' AND object_id = OBJECT_ID(N'dbo.quiz_attempts'))
    CREATE INDEX idx_attempts_learner_quiz ON dbo.quiz_attempts (learner_key, quiz_id, status);
GO

IF OBJECT_ID(N'dbo.quiz_attempt_answers', N'U') IS NULL
CREATE TABLE dbo.quiz_attempt_answers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_ids NVARCHAR(500) NULL,
    is_correct BIT NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);
