import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { SHEET_TITLE } from '#wb-tariffs/consts.js';

const KEY_FILE_PATH = './sheets-auth.json';
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
];

// Тип строки тарифа
type TariffRow = {
    date: string;
    dt_next_box: string;
    dt_till_max: string;
    box_delivery_and_storage_expr?: string;
    box_delivery_base?: number;
    box_delivery_coef_expr?: number;
    box_delivery_liter?: number;
    box_delivery_marketplace_base?: number;
    box_delivery_marketplace_coef_expr?: number;
    box_delivery_marketplace_liter?: number;
    box_storage_base?: number;
    box_storage_coef_expr?: number;
    box_storage_liter?: number;
    geo_name?: string;
    warehouse_name?: string;
};

// Получение клиента Google Sheets API
function getSheetsClient() {
    const auth = new GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });

    return google.sheets({ version: 'v4', auth });
}

// Создание нового Google Spreadsheet
export async function createSpreadsheet(title: string, sheetTitle = SHEET_TITLE): Promise<string> {
    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title },
            sheets: [{ properties: { title: sheetTitle } }],
        },
        fields: 'spreadsheetId',
    });

    return response.data.spreadsheetId!;
}

// Обновление одного листа данными
export async function updateGoogleSheet(sheetId: string, data: TariffRow[]): Promise<void> {
    const sheets = getSheetsClient();

    // Проверка наличия листа с нужным названием
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });

    const sheetExists = spreadsheet.data.sheets?.some(
        (s) => s.properties?.title === SHEET_TITLE
    );

    // Если лист отсутствует — создать его
    if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: SHEET_TITLE,
                            },
                        },
                    },
                ],
            },
        });
    }

    // Преобразуем данные в формат для записи в Google Sheets
    const values = data.map((row) => [
        row.date,
        row.dt_next_box,
        row.dt_till_max,
        row.box_delivery_and_storage_expr ?? '',
        row.box_delivery_base ?? '',
        row.box_delivery_coef_expr ?? '',
        row.box_delivery_liter ?? '',
        row.box_delivery_marketplace_base ?? '',
        row.box_delivery_marketplace_coef_expr ?? '',
        row.box_delivery_marketplace_liter ?? '',
        row.box_storage_base ?? '',
        row.box_storage_coef_expr ?? '',
        row.box_storage_liter ?? '',
        row.geo_name ?? '',
        row.warehouse_name ?? '',
    ]);

    // Добавляем заголовки
    values.unshift([
        'Date',
        'Dt Next Box',
        'Dt Till Max',
        'Box Delivery & Storage Expr',
        'Box Delivery Base',
        'Box Delivery Coef Expr',
        'Box Delivery Liter',
        'Box Delivery Marketplace Base',
        'Box Delivery Marketplace Coef Expr',
        'Box Delivery Marketplace Liter',
        'Box Storage Base',
        'Box Storage Coef Expr',
        'Box Storage Liter',
        'Geo Name',
        'Warehouse Name',
    ]);

    // Очистка существующего содержимого
    await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: SHEET_TITLE,
    });

    // Запись новых данных
    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: SHEET_TITLE,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
    });

    console.log(`✅ Лист "${sheetId}" успешно обновлён.`);
}

// Обновление всех листов
export async function updateAllSheets(sheetIds: string[], data: TariffRow[]): Promise<void> {
    for (const sheetId of sheetIds) {
        try {
            await updateGoogleSheet(sheetId, data);
        } catch (error) {
            console.error(`🔴 Ошибка при обновлении sheet ${sheetId}:`, error);
        }
    }
}
