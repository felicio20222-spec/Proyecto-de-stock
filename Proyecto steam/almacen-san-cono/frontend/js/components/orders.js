import { state } from "../core/state.js";
import { esc, money, dateFmt } from "../core/utils.js";
import { metric } from "../core/components.js";

export function orders() {
    const received = state.data.orders.filter(
        o => o.status === "Recibido"
    );

    const pending = state.data.orders.filter(
        o => o.status !== "Recibido"
    );

    return `
        <div class="metrics compact">
            ${metric(
                "Total invertido",
                money(received.reduce((a, o) => a + o.total, 0)),
                "money"
            )}

            ${metric("Pendientes", pending.length, "warn")}

            ${metric(
                "Total órdenes",
                state.data.orders.length,
                "cat"
            )}
        </div>

        <div class="orders-list">
            ${state.data.orders.map(o => `
                <section class="order-card">
                    <button
                        class="order-head"
                        data-expand="${o.id}"
                    >
                        <div>
                            <span class="eyebrow">
                                ${esc(o.number)}
                            </span>

                            <h2>${esc(o.supplier)}</h2>
                        </div>

                        <div class="order-meta">
                            <span>${o.items.length} productos</span>
                            <span>${dateFmt(o.date)}</span>

                            <strong class="mono">
                                ${money(o.total)}
                            </strong>

                            <span class="badge ${
                                o.status === "Recibido"
                                    ? "ok"
                                    : o.status === "Parcial"
                                        ? "warning"
                                        : "danger"
                            }">
                                ${o.status}
                            </span>

                            <b>⌄</b>
                        </div>
                    </button>

                    <div class="order-body" id="order-${o.id}">
                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Costo unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${o.items.map(i => `
                                        <tr>
                                            <td>
                                                <strong>
                                                    ${esc(i.product)}
                                                </strong>
                                            </td>

                                            <td class="mono">
                                                ${i.quantity}
                                            </td>

                                            <td class="mono">
                                                ${money(i.unitCost)}
                                            </td>

                                            <td class="mono">
                                                ${money(
                                                    i.quantity * i.unitCost
                                                )}
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>

                        ${
                            o.status !== "Recibido"
                                ? `
                                    <button
                                        class="primary receive"
                                        data-receive="${o.id}"
                                    >
                                        Marcar como recibido
                                    </button>
                                `
                                : `
                                    <span class="received-note">
                                        ✓ Stock actualizado al recibir
                                        esta orden
                                    </span>
                                `
                        }
                    </div>
                </section>
            `).join("")}
        </div>
    `;
}
