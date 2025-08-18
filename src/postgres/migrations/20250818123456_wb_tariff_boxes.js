import { WB_TARIFFS_TABLE_NAME } from "#wb-tariffs/consts.js";

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable(WB_TARIFFS_TABLE_NAME, (table) => {
        table.increments('id').primary();

        // Общие даты
        table.date('date').notNullable();
        table.date('dt_next_box');
        table.date('dt_till_max');

        // Данные склада
        table.string('box_delivery_and_storage_expr');
        table.decimal('box_delivery_base');
        table.decimal('box_delivery_coef_expr');
        table.decimal('box_delivery_liter');

        table.decimal('box_delivery_marketplace_base');
        table.decimal('box_delivery_marketplace_coef_expr');
        table.decimal('box_delivery_marketplace_liter');

        table.decimal('box_storage_base');
        table.decimal('box_storage_coef_expr');
        table.decimal('box_storage_liter');

        table.string('geo_name');
        table.string('warehouse_name');

        table.unique(['date', 'warehouse_name']);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists(WB_TARIFFS_TABLE_NAME);
}