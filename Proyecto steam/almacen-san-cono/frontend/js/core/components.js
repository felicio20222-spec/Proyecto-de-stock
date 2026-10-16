import { state } from "./state.js";
import { money, dateFmt, esc } from "./utils.js";

export function status(p) {
    if (p.stock <= 0) {
        return ["danger", "Sin stock"];
    }

    if (p.stock <= p.minStock) {
        return ["warning", "Stock bajo"];
    }

    return ["ok", "Stock OK"];
}

export function metrics() {
    const d = state.data;

    const active = d.products.filter(
        p => p.active
    );

    const low = d.products.filter(
        p => p.active && p.stock > 0 && p.stock <= p.minStock
    );

    const out = d.products.filter(
        p => p.active && p.stock === 0
    );

    const today = new Date().toISOString().slice(0, 10);

    return {
        products: active.length,

        revenue: d.sales
            .filter(s => s.date === today)
            .reduce((a, s) => a + s.total, 0),

        low: low.length,
        out: out.length,

        pending: d.orders.filter(
            o => o.status !== "Recibido"
        ).length
    };
}

export function metric(label, val, kind) {
    return `
        <div class="metric">
            <span class="eyebrow">${label}</span>
            <strong class="${kind}">${val}</strong>
        </div>
    `;
}

export function saleTable(rows, full = true) {
    if (!rows.length) {
        return `
            <div class="empty">
                No hay ventas para mostrar.
            </div>
        `;
    }

    return `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        ${full ? "<th>Cajero</th>" : ""}
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Fecha</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(s => `
                        <tr>
                            <td>
                                <strong>${esc(s.product)}</strong>
                            </td>

                            ${full ? `
                                <td>${esc(s.cashier)}</td>
                            ` : ""}

                            <td class="mono">${s.quantity}</td>
                            <td class="mono">${money(s.total)}</td>
                            <td class="mono">${dateFmt(s.date)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}
