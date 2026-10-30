const { sql, pool, poolConnect } = require("../config/db");

const findAll = async ({ search = "", difficulty = "", topic = "" } = {}) => {
    await poolConnect;

    let query = `
        SELECT
            q.id,
            q.content,
            q.difficulty,
            q.question_type,
            q.topic,
            q.created_at,
            q.updated_at,
            COUNT(o.id) AS options_count
        FROM questions q
                 LEFT JOIN question_options o ON q.id = o.question_id
        WHERE 1 = 1
    `;

    const request = pool.request();

    if (search) {
        query += " AND q.content LIKE @search";
        request.input("search", sql.NVarChar, `%${search}%`);
    }

    if (difficulty) {
        query += " AND q.difficulty = @difficulty";
        request.input("difficulty", sql.NVarChar, difficulty);
    }

    if (topic) {
        query += " AND q.topic LIKE @topic";
        request.input("topic", sql.NVarChar, `%${topic}%`);
    }

    query += `
        GROUP BY
            q.id,
            q.content,
            q.difficulty,
            q.question_type,
            q.topic,
            q.created_at,
            q.updated_at
        ORDER BY q.id DESC
    `;

    const result = await request.query(query);
    return result.recordset;
};

const findById = async (id) => {
    await poolConnect;

    const questionResult = await pool.request()
        .input("id", sql.Int, Number(id))
        .query("SELECT * FROM questions WHERE id = @id");

    if (questionResult.recordset.length === 0) {
        return null;
    }

    const optionsResult = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            SELECT id, option_text, is_correct, explanation
            FROM question_options
            WHERE question_id = @id
            ORDER BY id ASC
        `);

    return {
        ...questionResult.recordset[0],
        options: optionsResult.recordset
    };
};

const create = async (question) => {
    await poolConnect;

    const result = await pool.request()
        .input("content", sql.NVarChar(sql.MAX), question.content)
        .input("difficulty", sql.NVarChar(50), question.difficulty)
        .input("question_type", sql.NVarChar(50), question.question_type)
        .input("topic", sql.NVarChar(255), question.topic ?? null)
        .query(`
            INSERT INTO questions
                (content, difficulty, question_type, topic)
            OUTPUT INSERTED.id
            VALUES
                (@content, @difficulty, @question_type, @topic)
        `);

    const questionId = result.recordset[0].id;

    if (Array.isArray(question.options) && question.options.length > 0) {
        for (const opt of question.options) {
            if (opt.option_text && opt.option_text.trim()) {
                await pool.request()
                    .input("question_id", sql.Int, questionId)
                    .input("option_text", sql.NVarChar(sql.MAX), opt.option_text.trim())
                    .input("is_correct", sql.Bit, Boolean(opt.is_correct))
                    .input(
                        "explanation",
                        sql.NVarChar(sql.MAX),
                        opt.explanation ? opt.explanation.trim() : null
                    )
                    .query(`
                        INSERT INTO question_options
                            (question_id, option_text, is_correct, explanation)
                        VALUES
                            (@question_id, @option_text, @is_correct, @explanation)
                    `);
            }
        }
    }

    return findById(questionId);
};

const update = async (id, question) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .input("content", sql.NVarChar(sql.MAX), question.content)
        .input("difficulty", sql.NVarChar(50), question.difficulty)
        .input("question_type", sql.NVarChar(50), question.question_type)
        .input("topic", sql.NVarChar(255), question.topic ?? null)
        .query(`
            UPDATE questions
            SET content = @content,
                difficulty = @difficulty,
                question_type = @question_type,
                topic = @topic
            WHERE id = @id
        `);

    if (result.rowsAffected[0] === 0) {
        return null;
    }

    if (Array.isArray(question.options)) {
        await pool.request()
            .input("id", sql.Int, Number(id))
            .query("DELETE FROM question_options WHERE question_id = @id");

        for (const opt of question.options) {
            if (opt.option_text && opt.option_text.trim()) {
                await pool.request()
                    .input("question_id", sql.Int, Number(id))
                    .input("option_text", sql.NVarChar(sql.MAX), opt.option_text.trim())
                    .input("is_correct", sql.Bit, Boolean(opt.is_correct))
                    .input(
                        "explanation",
                        sql.NVarChar(sql.MAX),
                        opt.explanation ? opt.explanation.trim() : null
                    )
                    .query(`
                        INSERT INTO question_options
                            (question_id, option_text, is_correct, explanation)
                        VALUES
                            (@question_id, @option_text, @is_correct, @explanation)
                    `);
            }
        }
    }

    return findById(id);
};

const remove = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query("DELETE FROM questions WHERE id = @id");

    return result.rowsAffected[0] > 0;
};

const bulkCreate = async (questionsList) => {
    const createdItems = [];

    for (const question of questionsList) {
        const item = await create(question);
        createdItems.push(item);
    }

    return createdItems;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    bulkCreate
};