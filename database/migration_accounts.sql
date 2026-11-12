-- Learner accounts for sign-up, login, and profile management.
USE quiz_system;
GO

IF OBJECT_ID(N'dbo.learners', N'U') IS NULL
CREATE TABLE dbo.learners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    display_name NVARCHAR(120) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_learners_email UNIQUE (email)
);