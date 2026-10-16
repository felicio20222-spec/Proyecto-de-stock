import { state } from "../core/state.js";
import { $, esc, money } from "../core/utils.js";
import { status } from "../core/components.js";

export function products() {
    const cats = state.data.categories?.length
        ? state.data.categories
        : [...new Set(state.data.products.map(p => p.category))];

    return `
        <div class="toolbar">
            <div class="filters">
                <input
                    id="p-search"
                    placeholder="Buscar producto…"
                >

                <select id="p-cat">
                    <option value="">Todas las categorías</option>

                    ${cats.map(c => `
                        <option>${esc(c)}</option>
                    `).join("")}
                </select>

                <select id="p-active">
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>

            <div class="toolbar-actions">
                <button class="small" id="manage-categories">
                    Categorías
                </button>
                <button class="primary" id="new-product-inline">
                    + Nuevo producto
                </button>
            </div>
        </div>

        <section class="panel">
            <div class="table-wrap">
                <table id="products-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock actual</th>
                            <th>Stock mínimo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody></tbody>
                </table>
            </div>
        </section>
    `;
}

export function renderProductRows() {
    const q = ($("#p-search")?.value || "").toLowerCase();
    const cat = $("#p-cat")?.value || "";
    const act = $("#p-active")?.value || "all";

    const rows = state.data.products.filter(p =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!cat || p.category === cat) &&
        (
            act === "all" ||
            (act === "active" && p.active) ||
            (act === "inactive" && !p.active)
        )
    );

    $("#products-table tbody").innerHTML = rows.map(p => {
        const [cl, tx] = status(p);

        return `
            <tr class="${p.active ? "" : "muted"}">
                <td>
                    <strong>${esc(p.name)}</strong>
                    ${!p.active ? "<small>Inactivo</small>" : ""}
                </td>

                <td>${esc(p.category)}</td>
                <td class="mono">${money(p.price)}</td>
                <td class="mono">${p.stock}</td>
                <td class="mono">${p.minStock}</td>

                <td>
                    <span class="badge ${cl}">
                        ${tx}
                    </span>
                </td>

                <td>
                    <div class="row-actions">
                        <button
                            class="small primary"
                            data-sell="${p.id}"
                            ${!p.active || p.stock === 0 ? "disabled" : ""}
                        >
                            Vender
                        </button>

                        <button
                            class="small"
                            data-purchase="${p.id}"
                        >
                            Comprar
                        </button>

                        <button
                            class="small"
                            data-edit="${p.id}"
                        >
                            Editar
                        </button>

                        <button
                            class="small ghost"
                            data-toggle="${p.id}"
                        >
                            ${p.active ? "Desactivar" : "Activar"}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("") || `
        <tr>
            <td colspan="7">
                <div class="empty">
                    No se encontraron productos.
                </div>
            </td>
        </tr>
    `;
}
