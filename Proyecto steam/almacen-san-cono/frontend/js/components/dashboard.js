import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { money } from "../core/utils.js";
import { metrics, metric, saleTable } from "../core/components.js";

export function dashboard() {
    const d = state.data;
    const m = metrics();

    const latest = d.sales.slice(0, 5);

    const revenue = {};

    d.sales.forEach(s => {
        revenue[s.product] =
            (revenue[s.product] || 0) + s.total;
    });

    const top = Object.entries(revenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    const max = top[0]?.[1] || 1;
    const alert = m.low + m.out;

    return `
        <div class="metrics">
            ${metric("Productos activos", m.products, "cat")}
            ${metric("Ventas del día", money(m.revenue), "money")}
            ${metric("Stock bajo", m.low, "warn")}
            ${metric("Sin stock", m.out, "danger")}
            ${metric("Órdenes pendientes", m.pending, "pending")}
        </div>

        <div class="dashboard-grid">

            <section class="panel">
                <div class="panel-head">
                    <div>
                        <span class="eyebrow">ACTIVIDAD</span>
                        <h2>Últimas ventas</h2>
                    </div>

                    <button class="text-btn" data-go="sales">
                        Ver historial →
                    </button>
                </div>

                ${saleTable(latest, false)}
            </section>

            <aside class="panel top-products">
                <div class="panel-head">
                    <div>
                        <span class="eyebrow">REVENUE</span>
                        <h2>Más vendidos</h2>
                    </div>
                </div>

                ${top.map(([name, val], i) => `
                    <div class="top-row">
                        <div class="rank">
                            ${String(i + 1).padStart(2, "0")}
                        </div>

                        <div class="top-info">
                            <div>
                                <strong>${esc(name)}</strong>
                                <span>${money(val)}</span>
                            </div>

                            <div class="progress">
                                <i
                                    style="width:${
                                        Math.round(val / max * 100)
                                    }%"
                                ></i>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </aside>

        </div>

        ${alert ? `
            <button class="alert-strip" data-go="alerts">
                <span>!</span>
                <strong>Atención:</strong>

                hay ${m.out ? m.out + " producto(s) sin stock" : ""}
                ${m.out && m.low ? " y " : ""}
                ${m.low ? m.low + " producto(s) con stock bajo" : ""}.

                <u>Revisar alertas →</u>
            </button>
        ` : ""}
    `;
}
