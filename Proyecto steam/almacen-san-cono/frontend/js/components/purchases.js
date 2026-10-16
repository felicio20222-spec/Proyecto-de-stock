import { state } from "../core/state.js";
import { esc, money, dateFmt } from "../core/utils.js";
import { metric } from "../core/components.js";

export function purchases() {
    const purchases = state.data.purchases || [];
    const total = purchases.reduce((a, p) => a + Number(p.total || 0), 0);

    return `
        <div class="metrics compact">
            ${metric("Compras registradas", purchases.length, "cat")}
            ${metric("Total comprado", money(total), "money")}
            ${metric(
                "Productos ingresados",
                purchases.reduce(
                    (a, p) => a + Number(p.quantity || 0),
                    0
                ),
                "ok"
            )}
        </div>

        <div class="toolbar">
            <div>
                <span class="eyebrow">ENTRADAS DE STOCK</span>
                <h2>Registro de compras</h2>
            </div>
            <button class="primary" id="new-purchase">
                + Registrar compra
            </button>
        </div>

        <section class="panel">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Distribuidora</th>
                            <th>Cantidad</th>
                            <th>Costo unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.map(p => `
                            <tr>
                                <td class="mono">${dateFmt(p.date)}</td>
                                <td><strong>${esc(p.product)}</strong></td>
                                <td>${esc(p.supplier)}</td>
                                <td class="mono">${p.quantity}</td>
                                <td class="mono">${money(p.unitCost)}</td>
                                <td class="mono">${money(p.total)}</td>
                            </tr>
                        `).join("") || `
                            <tr>
                                <td colspan="6">
                                    <div class="empty">
                                        Todavía no hay compras registradas.
                                    </div>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}
