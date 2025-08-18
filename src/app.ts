import knex, { migrate, seed } from "#postgres/knex.js";
import { getTariffsSorted, updateTariffs } from "#wb-tariffs/getTariffs.js";
import { createSpreadsheet, updateAllSheets } from "#wb-tariffs/googleSheets.js";
import cron from "node-cron";

// Выполнение миграций и сидов
await migrate.latest();
await seed.run();
console.log("✅ Миграции и сиды выполнены");

// Основная функция обновления данных в Google Sheets
async function updateGoogleSheets() {
    try {
        await updateTariffs();
        const sheetsRecords = await knex("spreadsheets").select("*");

        // Создание нового документа, если таблица пуста (раскомментировать при наличии Google Workspace)
        /*
        if (!sheetsRecords.length) {
            const newSheetId = await createSpreadsheet("new sheet");
            await knex("spreadsheets").insert({
                spreadsheet_id: newSheetId,
            });
        }
        */

        const tariffs = await getTariffsSorted();
        const spreadsheetIds = sheetsRecords.map(record => record.spreadsheet_id);

        await updateAllSheets(spreadsheetIds, tariffs);
    } catch (error) {
        console.error("🔴 Ошибка при обновлении Google Sheets:", error);
    }
}

updateGoogleSheets();

// каждый час
cron.schedule("0 * * * *", async () => {
    await updateGoogleSheets();
});
