
// ==================================================
// 1. ESTADO Y UTILIDADES
// ==================================================

const state = {
    data: null,
    page: "dashboard"
};

const $ = (selector) => document.querySelector(selector);

const money = (n) =>
    new Intl.NumberFormat("es-UY", {
        style: "currency",
        currency: "UYU",
        maximumFractionDigits: 0
    }).format(n);

const dateFmt = (s) =>
    new Date(s + "T12:00:00").toLocaleDateString("es-UY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));


// ==================================================
// 2. COMUNICACIÓN CON LA API
// ==================================================

async function api(action, options = {}) {
    const r = await fetch(
        `api.php?action=${action}${options.query || ""}`,
        {
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json"
            },
            body: options.body
                ? JSON.stringify(options.body)
                : undefined
        }
    );

    const j = await r.json();

    if (!r.ok) {
        throw new Error(
            j.error || "No se pudo completar la operación."
        );
    }

    return j;
}


// ==================================================
// 3. ACTUALIZACIÓN Y RENDERIZADO GENERAL
// ==================================================

async function refresh() {
    state.data = await api("state");
    render();
}

function status(p) {
    if (p.stock <= 0) {
        return ["danger", "Sin stock"];
    }

    if (p.stock <= p.minStock) {
        return ["warning", "Stock bajo"];
    }

    return ["ok", "Stock OK"];
}

function metrics() {
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

function shell(title, number, content) {
    $("#section-number").textContent = `${number} / CONTROL`;
    $("#page-title").textContent = title;

    return content;
}

function render() {
    document.querySelectorAll(".nav-item").forEach(b => {
        b.classList.toggle(
            "active",
            b.dataset.page === state.page
        );
    });

    const pages = {
        dashboard: ["Inicio", "01"],
        products: ["Productos", "02"],
        purchases: ["Compras", "03"],
        sales: ["Ventas", "04"],
        orders: ["Órdenes de compra", "05"],
        suppliers: ["Distribuidoras", "06"],
        alerts: ["Alertas", "07"]
    };

    const [title, num] = pages[state.page];

    let html =
        state.page === "dashboard" ? dashboard() :
        state.page === "products" ? products() :
        state.page === "purchases" ? purchases() :
        state.page === "sales" ? sales() :
        state.page === "orders" ? orders() :
        state.page === "suppliers" ? suppliers() :
        alerts();

    $("#app").innerHTML = shell(title, num, html);

    bindPage();
}


// ==================================================
// 4. PANEL DE INICIO
// ==================================================

function dashboard() {
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
                                <i style="width:${Math.round(val / max * 100)}%"></i>
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


// ==================================================
// 5. COMPONENTES REUTILIZABLES
// ==================================================

function metric(label, val, kind) {
    return `
        <div class="metric">
            <span class="eyebrow">${label}</span>
            <strong class="${kind}">${val}</strong>
        </div>
    `;
}

function saleTable(rows, full = true) {
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


// ==================================================
// 6. PRODUCTOS
// ==================================================

function products() {
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

function renderProductRows() {
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


// ==================================================
// 7. COMPRAS
// ==================================================

function purchases() {
    const purchases = state.data.purchases || [];
    const total = purchases.reduce((a, p) => a + Number(p.total || 0), 0);

    return `
        <div class="metrics compact">
            ${metric("Compras registradas", purchases.length, "cat")}
            ${metric("Total comprado", money(total), "money")}
            ${metric("Productos ingresados", purchases.reduce((a,p) => a + Number(p.quantity || 0), 0), "ok")}
        </div>

        <div class="toolbar">
            <div>
                <span class="eyebrow">ENTRADAS DE STOCK</span>
                <h2>Registro de compras</h2>
            </div>
            <button class="primary" id="new-purchase">+ Registrar compra</button>
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
                            <tr><td colspan="6"><div class="empty">Todavía no hay compras registradas.</div></td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function openPurchase(productId = null) {
    const products = state.data.products.filter(p => p.active);
    const selected = productId ? products.find(p => p.id === productId) : products[0];
    const suppliers = state.data.suppliers || [];

    $("#modal").innerHTML = `
        <div class="modal-head">
            <div>
                <span class="eyebrow">ENTRADA DE STOCK</span>
                <h2>Registrar compra</h2>
            </div>
            <button class="close">×</button>
        </div>

        <form id="purchase-form">
            <label>
                Producto
                <select name="productId" required>
                    ${products.map(p => `
                        <option value="${p.id}" ${selected?.id === p.id ? "selected" : ""}>
                            ${esc(p.name)}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label>
                Distribuidora
                <select name="supplier">
                    <option value="">Sin distribuidora</option>
                    ${suppliers.map(s => `<option>${esc(s.name)}</option>`).join("")}
                </select>
            </label>

            <div class="form-grid">
                <label>
                    Cantidad
                    <input name="quantity" type="number" min="1" value="1" required>
                </label>
                <label>
                    Costo unitario
                    <input name="unitCost" type="number" min="0" step="0.01" value="0" required>
                </label>
            </div>

            <div class="modal-actions">
                <button type="button" class="small close">Cancelar</button>
                <button class="primary">Registrar compra</button>
            </div>
        </form>
    `;

    showModal();

    $("#purchase-form").onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
            state.data = await api("register_purchase", {
                method: "POST",
                body: Object.fromEntries(f)
            });
            hideModal();
            toast("Compra registrada y stock actualizado.");
            render();
        } catch (err) {
            toast(err.message, true);
        }
    };
}

// ==================================================
// 8. VENTAS
// ==================================================


function sales() {
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

function renderSales() {
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


// ==================================================
// 9. DISTRIBUIDORAS Y CATEGORÍAS
// ==================================================

function suppliers() {
    const list = state.data.suppliers || [];
    return `
        <div class="toolbar">
            <div>
                <span class="eyebrow">PROVEEDORES</span>
                <h2>Distribuidoras</h2>
            </div>
            <button class="primary" id="new-supplier">+ Nueva distribuidora</button>
        </div>

        <section class="panel">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        ${list.map(s => `
                            <tr>
                                <td><strong>${esc(s.name)}</strong></td>
                                <td>${esc(s.contact || "—")}</td>
                                <td>${esc(s.phone || "—")}</td>
                                <td><button class="small" data-edit-supplier="${s.id}">Editar</button></td>
                            </tr>
                        `).join("") || `<tr><td colspan="4"><div class="empty">No hay distribuidoras registradas.</div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function openSupplier(id = null) {
    const s = id ? (state.data.suppliers || []).find(x => x.id === id) : {name:"", phone:"", contact:""};
    $("#modal").innerHTML = `
        <div class="modal-head">
            <div><span class="eyebrow">${id ? "EDITAR" : "ALTA"}</span><h2>${id ? "Editar distribuidora" : "Nueva distribuidora"}</h2></div>
            <button class="close">×</button>
        </div>
        <form id="supplier-form">
            <input type="hidden" name="id" value="${id || ""}">
            <label>Nombre<input name="name" required value="${esc(s.name)}"></label>
            <div class="form-grid">
                <label>Contacto<input name="contact" value="${esc(s.contact || "")}"></label>
                <label>Teléfono<input name="phone" value="${esc(s.phone || "")}"></label>
            </div>
            <div class="modal-actions">
                <button type="button" class="small close">Cancelar</button>
                <button class="primary">Guardar distribuidora</button>
            </div>
        </form>
    `;
    showModal();
    $("#supplier-form").onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
            state.data = await api("save_supplier", {method:"POST", body:Object.fromEntries(f)});
            hideModal(); toast("Distribuidora guardada."); render();
        } catch(err) { toast(err.message, true); }
    };
}

function openCategoryManager() {
    const cats = state.data.categories || [];
    $("#modal").innerHTML = `
        <div class="modal-head">
            <div><span class="eyebrow">CATÁLOGO</span><h2>Categorías</h2></div>
            <button class="close">×</button>
        </div>
        <div class="category-list">
            ${cats.map(c => `<span class="badge ok">${esc(c)}</span>`).join("")}
        </div>
        <form id="category-form">
            <label>Nueva categoría<input name="name" placeholder="Ej.: Congelados" required></label>
            <div class="modal-actions">
                <button type="button" class="small close">Cerrar</button>
                <button class="primary">Agregar categoría</button>
            </div>
        </form>
    `;
    showModal();
    $("#category-form").onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        try {
            state.data = await api("save_category", {method:"POST", body:Object.fromEntries(f)});
            openCategoryManager();
            toast("Categoría agregada.");
        } catch(err) { toast(err.message, true); }
    };
}

// ==================================================
// 10. ÓRDENES DE COMPRA
// ==================================================


function orders() {
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
                                                <strong>${esc(i.product)}</strong>
                                            </td>

                                            <td class="mono">
                                                ${i.quantity}
                                            </td>

                                            <td class="mono">
                                                ${money(i.unitCost)}
                                            </td>

                                            <td class="mono">
                                                ${money(i.quantity * i.unitCost)}
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
                                        ✓ Stock actualizado al recibir esta orden
                                    </span>
                                `
                        }
                    </div>
                </section>
            `).join("")}
        </div>
    `;
}


// ==================================================
// 9. ALERTAS DE STOCK
// ==================================================

function alerts() {
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


// ==================================================
// 10. MODAL: CREAR Y EDITAR PRODUCTOS
// ==================================================

function openProduct(id = null) {
    const p = id
        ? state.data.products.find(x => x.id === id)
        : {
            name: "",
            category: "Bebidas",
            price: 0,
            stock: 0,
            minStock: 5,
            active: true
        };

    const cats = state.data.categories?.length
        ? state.data.categories
        : ["Bebidas", "Snacks", "Limpieza", "Lácteos", "Panadería", "Golosinas", "Higiene"];

    $("#modal").innerHTML = `
        <div class="modal-head">
            <div>
                <span class="eyebrow">
                    ${id ? "EDITAR" : "ALTA"}
                </span>

                <h2>
                    ${id ? "Editar producto" : "Nuevo producto"}
                </h2>
            </div>

            <button class="close">×</button>
        </div>

        <form id="product-form">
            <input
                type="hidden"
                name="id"
                value="${id || ""}"
            >

            <label>
                Nombre
                <input
                    name="name"
                    required
                    value="${esc(p.name)}"
                >
            </label>

            <label>
                Categoría
                <select name="category">
                    ${cats.map(c => `
                        <option ${c === p.category ? "selected" : ""}>
                            ${c}
                        </option>
                    `).join("")}
                </select>
            </label>

            <div class="form-grid">
                <label>
                    Precio
                    <input
                        name="price"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value="${p.price}"
                    >
                </label>

                <label>
                    Stock inicial
                    <input
                        name="stock"
                        type="number"
                        min="0"
                        required
                        value="${p.stock}"
                    >
                </label>
            </div>

            <label>
                Stock mínimo
                <input
                    name="minStock"
                    type="number"
                    min="0"
                    required
                    value="${p.minStock}"
                >
            </label>

            <div class="modal-actions">
                <button
                    type="button"
                    class="small close"
                >
                    Cancelar
                </button>

                <button class="primary">
                    Guardar producto
                </button>
            </div>
        </form>
    `;

    showModal();

    $("#product-form").onsubmit = async e => {
        e.preventDefault();

        const f = new FormData(e.target);

        try {
            state.data = await api("save_product", {
                method: "POST",
                body: Object.fromEntries(f)
            });

            hideModal();
            toast("Producto guardado.");
            render();

        } catch (err) {
            toast(err.message, true);
        }
    };
}


// ==================================================
// 11. MODAL: REGISTRAR VENTAS
// ==================================================

function openSell(id) {
    const p = state.data.products.find(
        x => x.id === id
    );

    $("#modal").innerHTML = `
        <div class="modal-head">
            <div>
                <span class="eyebrow">VENTA</span>
                <h2>${esc(p.name)}</h2>
            </div>

            <button class="close">×</button>
        </div>

        <form id="sell-form">
            <div class="stock-callout">
                <span>Disponible</span>
                <strong class="mono">
                    ${p.stock} unidades
                </strong>
            </div>

            <label>
                Cantidad
                <input
                    id="sell-qty"
                    name="quantity"
                    type="number"
                    min="1"
                    max="${p.stock}"
                    value="1"
                    required
                >
            </label>

            <label>
                Cajero
                <select name="cashier">
                    <option>Laura M.</option>
                    <option>Carlos R.</option>
                </select>
            </label>

            <div class="sale-total">
                Total
                <strong id="sell-total">
                    ${money(p.price)}
                </strong>
            </div>

            <div class="modal-actions">
                <button
                    type="button"
                    class="small close"
                >
                    Cancelar
                </button>

                <button class="primary">
                    Confirmar venta
                </button>
            </div>
        </form>
    `;

    showModal();

    const q = $("#sell-qty");
    const total = $("#sell-total");

    q.oninput = () => {
        q.value = Math.min(
            p.stock,
            Math.max(1, +q.value || 1)
        );

        total.textContent = money(p.price * q.value);
    };

    $("#sell-form").onsubmit = async e => {
        e.preventDefault();

        try {
            state.data = await api("sell", {
                method: "POST",
                body: {
                    productId: id,
                    quantity: +q.value,
                    cashier: e.target.cashier.value
                }
            });

            hideModal();
            toast("Venta registrada.");
            render();

        } catch (err) {
            toast(err.message, true);
        }
    };
}


// ==================================================
// 12. VENTANAS MODALES Y NOTIFICACIONES
// ==================================================

function showModal() {
    $("#modal-backdrop").classList.remove("hidden");
}

function hideModal() {
    $("#modal-backdrop").classList.add("hidden");
}

function toast(msg, error = false) {
    const t = $("#toast");

    t.textContent = msg;
    t.className = "toast show" + (error ? " error" : "");

    setTimeout(() => {
        t.className = "toast";
    }, 2600);
}


// ==================================================
// 13. EVENTOS DE LA PÁGINA
// ==================================================

function bindPage() {

    // Productos
    if (state.page === "products") {
        renderProductRows();

        ["p-search", "p-cat", "p-active"].forEach(id => {
            $("#" + id)?.addEventListener(
                "input",
                renderProductRows
            );
        });

        $("#new-product-inline")?.addEventListener(
            "click",
            () => openProduct()
        );

        $("#manage-categories")?.addEventListener(
            "click",
            () => openCategoryManager()
        );
    }


    // Ventas
    if (state.page === "sales") {
        ["s-from", "s-to", "s-search"].forEach(id => {
            $("#" + id)?.addEventListener(
                "input",
                renderSales
            );
        });

        renderSales();
    }


    // Compras
    if (state.page === "purchases") {
        $("#new-purchase")?.addEventListener("click", () => openPurchase());
    }

    // Distribuidoras
    if (state.page === "suppliers") {
        $("#new-supplier")?.addEventListener("click", () => openSupplier());
        document.querySelectorAll("[data-edit-supplier]").forEach(b => {
            b.onclick = () => openSupplier(+b.dataset.editSupplier);
        });
    }

    // Navegación
    document.querySelectorAll("[data-go]").forEach(b => {
        b.onclick = () => {
            state.page = b.dataset.go;
            render();
        };
    });


    // Registrar ventas
    document.querySelectorAll("[data-sell]").forEach(b => {
        b.onclick = () => {
            openSell(+b.dataset.sell);
        };
    });


    // Registrar compras desde Productos
    document.querySelectorAll("[data-purchase]").forEach(b => {
        b.onclick = () => openPurchase(+b.dataset.purchase);
    });

    // Editar productos
    document.querySelectorAll("[data-edit]").forEach(b => {
        b.onclick = () => {
            openProduct(+b.dataset.edit);
        };
    });


    // Activar o desactivar productos
    document.querySelectorAll("[data-toggle]").forEach(b => {
        b.onclick = async () => {
            try {
                state.data = await api("toggle_product", {
                    query: `&id=${b.dataset.toggle}`
                });

                toast("Estado actualizado.");
                render();

            } catch (e) {
                toast(e.message, true);
            }
        };
    });


    // Expandir órdenes
    document.querySelectorAll("[data-expand]").forEach(b => {
        b.onclick = () => {
            $("#order-" + b.dataset.expand)
                .classList.toggle("open");
        };
    });


    // Recibir órdenes
    document.querySelectorAll("[data-receive]").forEach(b => {
        b.onclick = async () => {
            if (!confirm(
                "¿Marcar esta orden como recibida y sumar sus cantidades al stock?"
            )) {
                return;
            }

            try {
                state.data = await api("receive_order", {
                    query: `&id=${b.dataset.receive}`
                });

                toast("Orden recibida y stock actualizado.");
                render();

            } catch (e) {
                toast(e.message, true);
            }
        };
    });
}


// ==================================================
// 14. INICIALIZACIÓN DE LA APLICACIÓN
// ==================================================

// Navegación principal
document.querySelectorAll(".nav-item").forEach(b => {
    b.onclick = () => {
        state.page = b.dataset.page;
        render();
    };
});



// Cerrar modal al hacer clic fuera
$("#modal-backdrop").onclick = e => {
    if (e.target.id === "modal-backdrop") {
        hideModal();
    }
};


// Cerrar modal con los botones correspondientes
document.addEventListener("click", e => {
    if (e.target.classList.contains("close")) {
        hideModal();
    }
});


// Mostrar fecha actual
$("#today").textContent = new Date().toLocaleDateString(
    "es-UY",
    {
        weekday: "short",
        day: "2-digit",
        month: "short"
    }
);


// Cargar los datos iniciales
refresh();
