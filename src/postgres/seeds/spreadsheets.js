/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: "1bc-p2PNVQcpQ9m_47-LESQ40eIel1Oq3HC1bM_TZX1c" }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
