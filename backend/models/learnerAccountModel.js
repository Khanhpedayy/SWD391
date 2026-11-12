const { sql, pool, poolConnect } = require("../config/db");

const findByEmail = async (email) => {
    await poolConnect;

    const result = await pool.request()
        .input("email", sql.NVarChar(254), email)
        .query("SELECT id, display_name, email, password_hash FROM learners WHERE email = @email");

    return result.recordset[0] || null;
};

const findById = async (id) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query("SELECT id, display_name, email FROM learners WHERE id = @id");

    return result.recordset[0] || null;
};

const create = async ({ display_name, email, password_hash }) => {
    await poolConnect;

    const result = await pool.request()
        .input("display_name", sql.NVarChar(120), display_name)
        .input("email", sql.NVarChar(254), email)
        .input("password_hash", sql.NVarChar(255), password_hash)
        .query(`
            INSERT INTO learners (display_name, email, password_hash)
            OUTPUT INSERTED.id, INSERTED.display_name, INSERTED.email
            VALUES (@display_name, @email, @password_hash)
        `);

    return result.recordset[0];
};

const updateProfile = async (id, { display_name, email }) => {
    await poolConnect;

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .input("display_name", sql.NVarChar(120), display_name)
        .input("email", sql.NVarChar(254), email)
        .query(`
            UPDATE learners
            SET display_name = @display_name,
                email = @email,
                updated_at = SYSDATETIME()
            OUTPUT INSERTED.id, INSERTED.display_name, INSERTED.email
            WHERE id = @id
        `);

    return result.recordset[0] || null;
};

module.exports = { findByEmail, findById, create, updateProfile };