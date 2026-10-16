import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { metric } from "../core/components.js";

export function alerts() {
    const ps = state.data.products.filter(
        p => p.active
    );

    const out = ps.filter(
        p => p.stock === 0
    );

    const low = ps.filter(
        p => p.stock > 0 && p.stock <= p.minStock
    );

    const ok = ps.filter(
        p => p.stock > p.minStock
    );

    return `
        <div class="metrics compact">
            ${metric("Sin stock", out.length, "danger")}
            ${metric("Stock bajo", low.length, "warn")}
            ${metric("Stock OK", ok.length, "ok")}
        </div>

        <div class="alerts-grid">
            <section>
                <div class="section-label danger-text">
                    SIN STOCK
                </div>

                ${out.map(alertCard).join("")
                    || emptyAlert("No hay productos sin stock.")}
            </section>

            <section>
                <div class="section-label warning-text">
                    STOCK BAJO
                </div>

                ${low.map(alertCard).join("")
                    || emptyAlert("No hay productos con stock bajo.")}
            </section>
        </div>

        ${
            (!out.length && !low.length)
                ? `
                    <div class="all-good">
                        ✓ Todo en orden. No hay alertas de stock.
                    </div>
                `
                : ""
        }
    `;
}

function alertCard(p) {
    const pct = Math.min(
        100,
        Math.round(p.stock / Math.max(p.minStock, 1) * 100)
    );

    return `
        <div class="alert-card">
            <div>
                <strong>${esc(p.name)}</strong>
                <span>${esc(p.category)}</span>
            </div>

            <div class="level">
                <div>
                    <span>${p.stock} / ${p.minStock}</span>
                    <span>${pct}%</span>
                </div>

                <div class="progress">
                    <i style="width:${pct}%"></i>
                </div>
            </div>

            <button class="small" data-go="orders">
                Ordenar compra
            </button>
        </div>
    `;
}

function emptyAlert(t) {
    return `
        <div class="empty small-empty">
            ${t}
        </div>
    `;
}
