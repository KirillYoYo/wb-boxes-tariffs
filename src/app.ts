import knex, { migrate, seed } from "#postgres/knex.js";
import { getTariffsSorted, updateTariffs } from "#wb-tariffs/getTariffs.js";
import cron from 'node-cron';
import { createSpreadsheet, updateAllSheets } from "#wb-tariffs/googleSheets.js";

await migrate.latest();
await seed.run();
console.log("All migrations and seeds have been run");

async function updateGoogleSheets() {
    await updateTariffs().catch(console.error);
    const sheetsIds = await knex('spreadsheets').select('*');

    /**
     * включить если есть Google Workspace
     * */
        // if (!sheetsIds.length) {
        //     const newSheetId = await createSpreadsheet('new sheet')
        //     await knex('spreadsheets').insert({
        //         spreadsheet_id: newSheetId,
        //     });
        // }

    const data = await getTariffsSorted()

    await updateAllSheets(sheetsIds.map(el => el.spreadsheet_id), data)
}

updateGoogleSheets()
cron.schedule('0 * * * *', async () => {
    updateGoogleSheets()
});