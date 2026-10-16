import { state } from "../core/state.js";
import { $, esc, money } from "../core/utils.js";
import { api } from "../core/api.js";
import { showModal, hideModal, toast } from "../core/ui.js";
import { render } from "../core/render.js";

export function openPurchase(productId = null) {
    const products = state.data.products.filter(p => p.active);
    const selected = productId
        ? products.find(p => p.id === productId)
        : products[0];
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
                        <option
                            value="${p.id}"
                            ${selected?.id === p.id ? "selected" : ""}
                        >
                            ${esc(p.name)}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label>
                Distribuidora
                <select name="supplier">
                    <option value="">Sin distribuidora</option>
                    ${suppliers
                        .map(s => `<option>${esc(s.name)}</option>`)
                        .join("")}
                </select>
            </label>

            <div class="form-grid">
                <label>
                    Cantidad
                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        value="1"
                        required
                    >
                </label>
                <label>
                    Costo unitario
                    <input
                        name="unitCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value="0"
                        required
                    >
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

export function openSupplier(id = null) {
    const s = id
        ? (state.data.suppliers || [])
            .find(x => x.id === id)
        : {name:"", phone:"", contact:""};
    $("#modal").innerHTML = `
        <div class="modal-head">
            <div>
                <span class="eyebrow">
                    ${id ? "EDITAR" : "ALTA"}
                </span>
                <h2>
                    ${id ? "Editar distribuidora" : "Nueva distribuidora"}
                </h2>
            </div>
            <button class="close">×</button>
        </div>
        <form id="supplier-form">
            <input type="hidden" name="id" value="${id || ""}">
            <label>
                Nombre
                <input name="name" required value="${esc(s.name)}">
            </label>
            <div class="form-grid">
                <label>
                    Contacto
                    <input
                        name="contact"
                        value="${esc(s.contact || "")}"
                    >
                </label>
                <label>
                    Teléfono
                    <input
                        name="phone"
                        value="${esc(s.phone || "")}"
                    >
                </label>
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
            state.data = await api("save_supplier", {
                method: "POST",
                body: Object.fromEntries(f)
            });
            hideModal(); toast("Distribuidora guardada."); render();
        } catch(err) { toast(err.message, true); }
    };
}

export function openCategoryManager() {
    const cats = state.data.categories || [];
    $("#modal").innerHTML = `
        <div class="modal-head">
            <div>
                <span class="eyebrow">CATÁLOGO</span>
                <h2>Categorías</h2>
            </div>
            <button class="close">×</button>
        </div>
        <div class="category-list">
            ${cats.map(c => `<span class="badge ok">${esc(c)}</span>`).join("")}
        </div>
        <form id="category-form">
            <label>
                Nueva categoría
                <input
                    name="name"
                    placeholder="Ej.: Congelados"
                    required
                >
            </label>
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
            state.data = await api("save_category", {
                method: "POST",
                body: Object.fromEntries(f)
            });
            openCategoryManager();
            toast("Categoría agregada.");
        } catch(err) { toast(err.message, true); }
    };
}

export function openProduct(id = null) {
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
        : [
            "Bebidas",
            "Snacks",
            "Limpieza",
            "Lácteos",
            "Panadería",
            "Golosinas",
            "Higiene"
        ];

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

export function openSell(id) {
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
