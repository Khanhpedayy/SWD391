-- Migration for Learner Quiz Practice module
-- New tables only. Does not alter existing question/subject/quiz columns.

USE quiz_system;

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    learner_key VARCHAR(64) NOT NULL,
    status ENUM('InProgress', 'Submitted') NOT NULL DEFAULT 'InProgress',
    score DECIMAL(5,2) NULL,
    passed TINYINT(1) NULL,
    question_order TEXT NULL,
    option_order TEXT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_attempts_learner_quiz (learner_key, quiz_id, status)
);

CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_ids VARCHAR(500) NULL,
    is_correct TINYINT(1) NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt_question (attempt_id, question_id)
);
