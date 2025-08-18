import knex from '../postgres/knex.js';
import axios from 'axios';
import 'dotenv/config';
import { WB_TARIFFS_TABLE_NAME } from "#wb-tariffs/consts.js";
import { parseDecimalValue } from "#utils/utils.js";

async function fetchTariffsFromApi(): Promise<any> {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const response = await axios.get('https://common-api.wildberries.ru/api/v1/tariffs/box', {
        params: {
            date: formattedDate
        },
        headers: {
            'Authorization': process.env.WP_TOKEN as string
        }
    });
    return response.data?.response?.data;
}

export async function updateTariffs() {
    const data = await fetchTariffsFromApi();

    const { dtNextBox, dtTillMax, warehouseList } = data;

    if (!warehouseList || !Array.isArray(warehouseList)) {
        console.warn('⚠️ Получены некорректные данные, warehouseList отсутствует.');
        return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0]; // '2025-08-18'

    const rowsToInsert = warehouseList.map((item: any) => ({
        dt_next_box: dtNextBox || null,
        dt_till_max: dtTillMax || null,

        box_delivery_and_storage_expr: item.boxDeliveryAndStorageExpr,
        box_delivery_base: parseDecimalValue(item.boxDeliveryBase),
        box_delivery_coef_expr: parseDecimalValue(item.boxDeliveryCoefExpr),
        box_delivery_liter: parseDecimalValue(item.boxDeliveryLiter.replace(',', '.')),

        box_delivery_marketplace_base: parseDecimalValue(item.boxDeliveryMarketplaceBase),
        box_delivery_marketplace_coef_expr: parseDecimalValue(item.boxDeliveryMarketplaceCoefExpr),
        box_delivery_marketplace_liter: parseDecimalValue(item.boxDeliveryMarketplaceLiter.replace(',', '.')),

        box_storage_base: parseDecimalValue(item.boxStorageBase),
        box_storage_coef_expr: parseDecimalValue(item.boxStorageCoefExpr),
        box_storage_liter: parseDecimalValue(item.boxStorageLiter),

        geo_name: item.geoName,
        warehouse_name: item.warehouseName,

        // updated_at: new Date(),
        date: date
    }));

    await knex(WB_TARIFFS_TABLE_NAME)
        .insert(rowsToInsert)
        .onConflict(['date', 'warehouse_name'])
        .merge()

    console.log(`✅ Обновлено тарифов: ${rowsToInsert.length}`);
}

export async function getTariffsSorted() {
    return await knex('tariff_boxes')
        .select('*')
        .orderBy('box_delivery_coef_expr', 'asc'); // сортировка по возрастанию коэффициента
}
