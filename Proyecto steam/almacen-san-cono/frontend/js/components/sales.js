import { state } from "../core/state.js";
import { $, esc, money, dateFmt } from "../core/utils.js";
import { metric, saleTable } from "../core/components.js";

export function sales() {
    return `
        <div class="toolbar">
            <div class="filters">
                <label>
                    Desde
                    <input
                        type="date"
                        id="s-from"
                        value="2026-09-05"
                    >
                </label>

                <label>
                    Hasta
                    <input
                        type="date"
                        id="s-to"
                        value="2026-09-15"
                    >
                </label>

                <input
                    id="s-search"
                    placeholder="Producto o cajero…"
                >
            </div>
        </div>

        <div id="sales-content"></div>
    `;
}

export function renderSales() {
    const from = $("#s-from")?.value || "";
    const to = $("#s-to")?.value || "";
    const q = ($("#s-search")?.value || "").toLowerCase();

    const rows = state.data.sales.filter(s =>
        (!from || s.date >= from) &&
        (!to || s.date <= to) &&
        (
            !q ||
            s.product.toLowerCase().includes(q) ||
            s.cashier.toLowerCase().includes(q)
        )
    );

    const revenue = rows.reduce(
        (a, s) => a + s.total, 0
    );

    const units = rows.reduce(
        (a, s) => a + s.quantity, 0
    );

    const grouped = {};

    rows.forEach(s => {
        (grouped[s.date] ??= []).push(s);
    });

    $("#sales-content").innerHTML = `
        <div class="metrics compact">
            ${metric("Total recaudado", money(revenue), "money")}
            ${metric("Transacciones", rows.length, "cat")}
            ${metric("Unidades vendidas", units, "cat")}
        </div>

        <section class="panel">
            ${
                Object.keys(grouped)
                    .sort()
                    .reverse()
                    .map(day => `
                        <div class="date-group">
                            <h3>${dateFmt(day)}</h3>
                            ${saleTable(grouped[day], true)}
                        </div>
                    `)
                    .join("")
                || '<div class="empty">No hay ventas en este período.</div>'
            }
        </section>
    `;
}
