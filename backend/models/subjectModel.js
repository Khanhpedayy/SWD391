const { sql, pool, poolConnect } = require("../config/db");

// ==================== SUBJECTS ====================

const findAllSubjects = async () => {
    await poolConnect;

    const result = await pool.request().query(`
        SELECT *
        FROM subjects
        ORDER BY name ASC
    `);

    return result.recordset;
};

const findSubjectById = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            SELECT *
            FROM subjects
            WHERE id = @id
        `);

    return result.recordset[0] || null;
};

const createSubject = async ({
                                 name,
                                 code,
                                 description,
                                 status = "Active"
                             }) => {
    await poolConnect;

    const result = await pool.request()
        .input("name", sql.NVarChar(255), name)
        .input("code", sql.NVarChar(100), code)
        .input("description", sql.NVarChar(sql.MAX), description ?? null)
        .input("status", sql.NVarChar(50), status)
        .query(`
            INSERT INTO subjects (name, code, description, status)
            OUTPUT INSERTED.id
            VALUES (@name, @code, @description, @status)
        `);

    const newId = result.recordset[0].id;
    return findSubjectById(newId);
};

const updateSubject = async (
    id,
    { name, code, description, status }
) => {
    await poolConnect;

    await pool.request()
        .input("id", sql.Int, Number(id))
        .input("name", sql.NVarChar(255), name)
        .input("code", sql.NVarChar(100), code)
        .input("description", sql.NVarChar(sql.MAX), description ?? null)
        .input("status", sql.NVarChar(50), status)
        .query(`
            UPDATE subjects
            SET name = @name,
                code = @code,
                description = @description,
                status = @status
            WHERE id = @id
        `);

    return findSubjectById(id);
};

const deleteSubject = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            DELETE FROM subjects
            WHERE id = @id
        `);

    return result.rowsAffected[0] > 0;
};

// ==================== TOPICS ====================

const findTopicsBySubjectId = async (subjectId) => {
    await poolConnect;

    const result = await pool.request()
        .input("subjectId", sql.Int, Number(subjectId))
        .query(`
            SELECT *
            FROM topics
            WHERE subject_id = @subjectId
            ORDER BY name ASC
        `);

    return result.recordset;
};

const findAllTopics = async () => {
    await poolConnect;

    const result = await pool.request().query(`
        SELECT t.*, s.name AS subject_name
        FROM topics t
        LEFT JOIN subjects s ON t.subject_id = s.id
        ORDER BY t.name ASC
    `);

    return result.recordset;
};

const createTopic = async ({
                               subject_id,
                               name,
                               description
                           }) => {
    await poolConnect;

    const result = await pool.request()
        .input("subject_id", sql.Int, Number(subject_id))
        .input("name", sql.NVarChar(255), name)
        .input("description", sql.NVarChar(sql.MAX), description ?? null)
        .query(`
            INSERT INTO topics (subject_id, name, description)
            OUTPUT INSERTED.id
            VALUES (@subject_id, @name, @description)
        `);

    const newId = result.recordset[0].id;

    const topicResult = await pool.request()
        .input("id", sql.Int, newId)
        .query(`
            SELECT *
            FROM topics
            WHERE id = @id
        `);

    return topicResult.recordset[0] || null;
};

const deleteTopic = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            DELETE FROM topics
            WHERE id = @id
        `);

    return result.rowsAffected[0] > 0;
};

module.exports = {
    findAllSubjects,
    findSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    findAllTopics,
    findTopicsBySubjectId,
    createTopic,
    deleteTopic
};