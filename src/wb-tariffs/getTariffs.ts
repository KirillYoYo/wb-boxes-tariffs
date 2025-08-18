import knex from '../postgres/knex.js';
import axios from 'axios';
import 'dotenv/config';
import { WB_TARIFFS_TABLE_NAME } from '#wb-tariffs/consts.js';
import { parseDecimalValue } from '#utils/utils.js';

// Получение тарифов с API Wildberries
async function fetchTariffsFromApi(): Promise<any> {
    const formattedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const response = await axios.get('https://common-api.wildberries.ru/api/v1/tariffs/box', {
        params: { date: formattedDate },
        headers: {
            Authorization: process.env.WP_TOKEN as string,
        },
    });

    return response.data?.response?.data;
}

// Обновление тарифов в базе данных
export async function updateTariffs() {
    const data = await fetchTariffsFromApi();
    const { dtNextBox, dtTillMax, warehouseList } = data || {};

    if (!Array.isArray(warehouseList)) {
        console.warn('⚠️ Неверный формат данных: warehouseList отсутствует или не массив.');
        return;
    }

    const date = new Date().toISOString().split('T')[0];

    const rowsToInsert = warehouseList.map((item: any) => ({
        dt_next_box: dtNextBox || null,
        dt_till_max: dtTillMax || null,

        box_delivery_and_storage_expr: item.boxDeliveryAndStorageExpr,
        box_delivery_base: parseDecimalValue(item.boxDeliveryBase),
        box_delivery_coef_expr: parseDecimalValue(item.boxDeliveryCoefExpr),
        box_delivery_liter: parseDecimalValue(item.boxDeliveryLiter?.replace(',', '.')),

        box_delivery_marketplace_base: parseDecimalValue(item.boxDeliveryMarketplaceBase),
        box_delivery_marketplace_coef_expr: parseDecimalValue(item.boxDeliveryMarketplaceCoefExpr),
        box_delivery_marketplace_liter: parseDecimalValue(item.boxDeliveryMarketplaceLiter?.replace(',', '.')),

        box_storage_base: parseDecimalValue(item.boxStorageBase),
        box_storage_coef_expr: parseDecimalValue(item.boxStorageCoefExpr),
        box_storage_liter: parseDecimalValue(item.boxStorageLiter),

        geo_name: item.geoName,
        warehouse_name: item.warehouseName,

        date, // дата загрузки
    }));

    await knex(WB_TARIFFS_TABLE_NAME)
        .insert(rowsToInsert)
        .onConflict(['date', 'warehouse_name'])
        .merge();

    console.log(`✅ Обновлено тарифов: ${rowsToInsert.length}`);
}

// Получение тарифов с сортировкой по коэффициенту
export async function getTariffsSorted() {
    return await knex(WB_TARIFFS_TABLE_NAME)
        .select('*')
        .orderBy('box_delivery_coef_expr', 'asc');
}
