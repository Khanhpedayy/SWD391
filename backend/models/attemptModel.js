
const { sql, pool, poolConnect } = require("../config/db");

// ==================== HELPERS ====================

const parseJson = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const mapAttempt = (row) => {
    if (!row) return null;

    return {
        ...row,
        question_order: parseJson(row.question_order, []),
        option_order: parseJson(row.option_order, {}),
        passed:
            row.passed === null || row.passed === undefined
                ? null
                : Boolean(row.passed)
    };
};

// Shared SELECT for attempt details
const ATTEMPT_SELECT = `
    SELECT
        qa.*,
        qz.title,
        qz.duration_minutes,
        qz.pass_score,
        qz.topic,
        qz.status AS quiz_status,
        s.name AS subject_name
    FROM quiz_attempts qa
    INNER JOIN quizzes qz ON qa.quiz_id = qz.id
    LEFT JOIN subjects s ON qz.subject_id = s.id
`;

// ==================== FIND ATTEMPT ====================

const findById = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            ${ATTEMPT_SELECT}
            WHERE qa.id = @id
        `);

    return mapAttempt(result.recordset[0]);
};

const findInProgressByQuiz = async (quizId, learnerKey) => {
    await poolConnect;

    const result = await pool.request()
        .input("quizId", sql.Int, Number(quizId))
        .input("learnerKey", sql.NVarChar(255), learnerKey)
        .query(`
            ${ATTEMPT_SELECT}
            WHERE qa.quiz_id = @quizId
              AND qa.learner_key = @learnerKey
              AND qa.status = 'InProgress'
            ORDER BY qa.id DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        `);

    return mapAttempt(result.recordset[0]);
};

const findByLearner = async (learnerKey, { status = "" } = {}) => {
    await poolConnect;

    const request = pool.request()
        .input("learnerKey", sql.NVarChar(255), learnerKey);

    let query = `
        ${ATTEMPT_SELECT}
        WHERE qa.learner_key = @learnerKey
    `;

    if (status) {
        query += " AND qa.status = @status";
        request.input("status", sql.NVarChar(50), status);
    }

    query += " ORDER BY qa.updated_at DESC, qa.id DESC";

    const result = await request.query(query);

    return result.recordset.map(mapAttempt);
};

// ==================== CREATE ATTEMPT ====================

const create = async ({
                          quiz_id,
                          learner_key,
                          question_order,
                          option_order
                      }) => {
    await poolConnect;

    const result = await pool.request()
        .input("quiz_id", sql.Int, Number(quiz_id))
        .input("learner_key", sql.NVarChar(255), learner_key)
        .input(
            "question_order",
            sql.NVarChar(sql.MAX),
            JSON.stringify(question_order || [])
        )
        .input(
            "option_order",
            sql.NVarChar(sql.MAX),
            JSON.stringify(option_order || {})
        )
        .query(`
            INSERT INTO quiz_attempts (
                quiz_id,
                learner_key,
                status,
                question_order,
                option_order
            )
            OUTPUT INSERTED.id
            VALUES (
                @quiz_id,
                @learner_key,
                'InProgress',
                @question_order,
                @option_order
            )
        `);

    return findById(result.recordset[0].id);
};

// ==================== SAVE ANSWERS ====================

const saveAnswers = async (attemptId, answers) => {
    await poolConnect;

    for (const answer of answers) {
        const selectedOptionIds = JSON.stringify(
            answer.selected_option_ids || []
        );

        // Update an existing answer first.
        const updateResult = await pool.request()
            .input("attemptId", sql.Int, Number(attemptId))
            .input(
                "questionId",
                sql.Int,
                Number(answer.question_id)
            )
            .input(
                "selectedOptionIds",
                sql.NVarChar(sql.MAX),
                selectedOptionIds
            )
            .query(`
                UPDATE quiz_attempt_answers
                SET selected_option_ids = @selectedOptionIds
                WHERE attempt_id = @attemptId
                  AND question_id = @questionId
            `);

        // Insert if the answer does not exist yet.
        if (updateResult.rowsAffected[0] === 0) {
            await pool.request()
                .input("attemptId", sql.Int, Number(attemptId))
                .input(
                    "questionId",
                    sql.Int,
                    Number(answer.question_id)
                )
                .input(
                    "selectedOptionIds",
                    sql.NVarChar(sql.MAX),
                    selectedOptionIds
                )
                .query(`
                    INSERT INTO quiz_attempt_answers (
                        attempt_id,
                        question_id,
                        selected_option_ids
                    )
                    VALUES (
                        @attemptId,
                        @questionId,
                        @selectedOptionIds
                    )
                `);
        }
    }

    await pool.request()
        .input("attemptId", sql.Int, Number(attemptId))
        .query(`
            UPDATE quiz_attempts
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = @attemptId
        `);
};

// ==================== FIND ANSWERS ====================

const findAnswers = async (attemptId) => {
    await poolConnect;

    const result = await pool.request()
        .input("attemptId", sql.Int, Number(attemptId))
        .query(`
            SELECT *
            FROM quiz_attempt_answers
            WHERE attempt_id = @attemptId
        `);

    return result.recordset.map((row) => ({
        ...row,
        selected_option_ids: parseJson(
            row.selected_option_ids,
            []
        ),
        is_correct:
            row.is_correct === null || row.is_correct === undefined
                ? null
                : Boolean(row.is_correct)
    }));
};

// ==================== SUBMIT AND GRADE ====================

const markSubmitted = async (
    attemptId,
    { score, passed, gradedAnswers }
) => {
    await poolConnect;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const answer of gradedAnswers) {
            const selectedOptionIds = JSON.stringify(
                answer.selected_option_ids || []
            );

            const isCorrect = Boolean(answer.is_correct);

            const updateResult = await new sql.Request(transaction)
                .input("attemptId", sql.Int, Number(attemptId))
                .input(
                    "questionId",
                    sql.Int,
                    Number(answer.question_id)
                )
                .input(
                    "selectedOptionIds",
                    sql.NVarChar(sql.MAX),
                    selectedOptionIds
                )
                .input("isCorrect", sql.Bit, isCorrect)
                .query(`
                    UPDATE quiz_attempt_answers
                    SET
                        selected_option_ids = @selectedOptionIds,
                        is_correct = @isCorrect
                    WHERE attempt_id = @attemptId
                      AND question_id = @questionId
                `);

            if (updateResult.rowsAffected[0] === 0) {
                await new sql.Request(transaction)
                    .input("attemptId", sql.Int, Number(attemptId))
                    .input(
                        "questionId",
                        sql.Int,
                        Number(answer.question_id)
                    )
                    .input(
                        "selectedOptionIds",
                        sql.NVarChar(sql.MAX),
                        selectedOptionIds
                    )
                    .input("isCorrect", sql.Bit, isCorrect)
                    .query(`
                        INSERT INTO quiz_attempt_answers (
                            attempt_id,
                            question_id,
                            selected_option_ids,
                            is_correct
                        )
                        VALUES (
                            @attemptId,
                            @questionId,
                            @selectedOptionIds,
                            @isCorrect
                        )
                    `);
            }
        }

        await new sql.Request(transaction)
            .input("attemptId", sql.Int, Number(attemptId))
            .input("score", sql.Decimal(10, 2), score)
            .input("passed", sql.Bit, Boolean(passed))
            .query(`
                UPDATE quiz_attempts
                SET
                    status = 'Submitted',
                    score = @score,
                    passed = @passed,
                    submitted_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @attemptId
            `);

        await transaction.commit();
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            // The transaction may already have been rolled back.
        }

        throw error;
    }

    return findById(attemptId);
};

module.exports = {
    findById,
    findInProgressByQuiz,
    findByLearner,
    create,
    saveAnswers,
    findAnswers,
    markSubmitted
};
