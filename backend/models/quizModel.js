
const { sql, pool, poolConnect } = require("../config/db");

// ==================== LIST QUIZZES ====================

const findAll = async ({
                           search = "",
                           subject_id = "",
                           status = ""
                       } = {}) => {
    await poolConnect;

    const request = pool.request();

    let query = `
        SELECT
            qz.*,
            s.name AS subject_name,
            (
                SELECT COUNT(*)
                FROM quiz_questions qq
                WHERE qq.quiz_id = qz.id
            ) AS question_count
        FROM quizzes qz
        LEFT JOIN subjects s ON qz.subject_id = s.id
        WHERE 1 = 1
    `;

    if (search) {
        query += " AND qz.title LIKE @search";
        request.input("search", sql.NVarChar(255), `%${search}%`);
    }

    if (subject_id !== "" && subject_id !== null) {
        query += " AND qz.subject_id = @subject_id";
        request.input("subject_id", sql.Int, Number(subject_id));
    }

    if (status) {
        query += " AND qz.status = @status";
        request.input("status", sql.NVarChar(50), status);
    }

    query += " ORDER BY qz.id DESC";

    const result = await request.query(query);
    return result.recordset;
};

// ==================== QUIZ DETAILS ====================

const findById = async (id) => {
    await poolConnect;

    const quizResult = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            SELECT
                qz.*,
                s.name AS subject_name
            FROM quizzes qz
            LEFT JOIN subjects s ON qz.subject_id = s.id
            WHERE qz.id = @id
        `);

    const quiz = quizResult.recordset[0];

    if (!quiz) {
        return null;
    }

    const questionsResult = await pool.request()
        .input("quiz_id", sql.Int, Number(id))
        .query(`
            SELECT
                q.id,
                q.content,
                q.difficulty,
                q.question_type,
                q.topic,
                qq.order_index,
                qq.score_weight
            FROM quiz_questions qq
            INNER JOIN questions q ON qq.question_id = q.id
            WHERE qq.quiz_id = @quiz_id
            ORDER BY qq.order_index ASC, qq.id ASC
        `);

    const questions = questionsResult.recordset;

    // Load options for each question
    for (const question of questions) {
        const optionsResult = await pool.request()
            .input("question_id", sql.Int, question.id)
            .query(`
                SELECT
                    id,
                    option_text,
                    is_correct,
                    explanation
                FROM question_options
                WHERE question_id = @question_id
                ORDER BY id ASC
            `);

        question.options = optionsResult.recordset;
    }

    return {
        ...quiz,
        questions
    };
};

// ==================== CREATE QUIZ ====================

const create = async (quizData) => {
    await poolConnect;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const insertResult = await new sql.Request(transaction)
            .input("title", sql.NVarChar(255), quizData.title)
            .input(
                "subject_id",
                sql.Int,
                quizData.subject_id ? Number(quizData.subject_id) : null
            )
            .input(
                "topic",
                sql.NVarChar(255),
                quizData.topic || "General"
            )
            .input(
                "duration_minutes",
                sql.Int,
                quizData.duration_minutes ?? 60
            )
            .input(
                "pass_score",
                sql.Decimal(5, 2),
                quizData.pass_score ?? 5.0
            )
            .input(
                "shuffle_questions",
                sql.Bit,
                Boolean(quizData.shuffle_questions)
            )
            .input(
                "shuffle_options",
                sql.Bit,
                Boolean(quizData.shuffle_options)
            )
            .input(
                "status",
                sql.NVarChar(50),
                quizData.status || "Draft"
            )
            .query(`
                INSERT INTO quizzes (
                    title,
                    subject_id,
                    topic,
                    duration_minutes,
                    pass_score,
                    shuffle_questions,
                    shuffle_options,
                    status
                )
                OUTPUT INSERTED.id
                VALUES (
                    @title,
                    @subject_id,
                    @topic,
                    @duration_minutes,
                    @pass_score,
                    @shuffle_questions,
                    @shuffle_options,
                    @status
                )
            `);

        const quizId = insertResult.recordset[0].id;
        const questionIds = quizData.question_ids;

        if (Array.isArray(questionIds) && questionIds.length > 0) {
            for (let i = 0; i < questionIds.length; i++) {
                await new sql.Request(transaction)
                    .input("quiz_id", sql.Int, quizId)
                    .input("question_id", sql.Int, Number(questionIds[i]))
                    .input("order_index", sql.Int, i + 1)
                    .input("score_weight", sql.Decimal(5, 2), 1.0)
                    .query(`
                        INSERT INTO quiz_questions (
                            quiz_id,
                            question_id,
                            order_index,
                            score_weight
                        )
                        VALUES (
                            @quiz_id,
                            @question_id,
                            @order_index,
                            @score_weight
                        )
                    `);
            }
        }

        await transaction.commit();

        return await findById(quizId);
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            // Transaction may already be rolled back.
        }

        throw error;
    }
};

// ==================== UPDATE QUIZ ====================

const update = async (id, quizData) => {
    await poolConnect;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input("id", sql.Int, Number(id))
            .input("title", sql.NVarChar(255), quizData.title)
            .input(
                "subject_id",
                sql.Int,
                quizData.subject_id ? Number(quizData.subject_id) : null
            )
            .input(
                "topic",
                sql.NVarChar(255),
                quizData.topic || "General"
            )
            .input(
                "duration_minutes",
                sql.Int,
                quizData.duration_minutes ?? 60
            )
            .input(
                "pass_score",
                sql.Decimal(5, 2),
                quizData.pass_score ?? 5.0
            )
            .input(
                "shuffle_questions",
                sql.Bit,
                Boolean(quizData.shuffle_questions)
            )
            .input(
                "shuffle_options",
                sql.Bit,
                Boolean(quizData.shuffle_options)
            )
            .input(
                "status",
                sql.NVarChar(50),
                quizData.status || "Draft"
            )
            .query(`
                UPDATE quizzes
                SET
                    title = @title,
                    subject_id = @subject_id,
                    topic = @topic,
                    duration_minutes = @duration_minutes,
                    pass_score = @pass_score,
                    shuffle_questions = @shuffle_questions,
                    shuffle_options = @shuffle_options,
                    status = @status
                WHERE id = @id
            `);

        // Replace question links only when question_ids is provided.
        if (Array.isArray(quizData.question_ids)) {
            await new sql.Request(transaction)
                .input("quiz_id", sql.Int, Number(id))
                .query(`
                    DELETE FROM quiz_questions
                    WHERE quiz_id = @quiz_id
                `);

            for (let i = 0; i < quizData.question_ids.length; i++) {
                await new sql.Request(transaction)
                    .input("quiz_id", sql.Int, Number(id))
                    .input(
                        "question_id",
                        sql.Int,
                        Number(quizData.question_ids[i])
                    )
                    .input("order_index", sql.Int, i + 1)
                    .input("score_weight", sql.Decimal(5, 2), 1.0)
                    .query(`
                        INSERT INTO quiz_questions (
                            quiz_id,
                            question_id,
                            order_index,
                            score_weight
                        )
                        VALUES (
                            @quiz_id,
                            @question_id,
                            @order_index,
                            @score_weight
                        )
                    `);
            }
        }

        await transaction.commit();

        return await findById(id);
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            // Transaction may already be rolled back.
        }

        throw error;
    }
};

// ==================== DELETE QUIZ ====================

const remove = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            DELETE FROM quizzes
            WHERE id = @id
        `);

    return result.rowsAffected[0] > 0;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
