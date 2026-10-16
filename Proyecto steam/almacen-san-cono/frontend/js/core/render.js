import { state } from "./state.js";
import { $ } from "./utils.js";
import {
    dashboard
} from "../components/dashboard.js";
import {
    products
} from "../components/products.js";
import {
    purchases
} from "../components/purchases.js";
import {
    sales
} from "../components/sales.js";
import {
    orders
} from "../components/orders.js";
import {
    suppliers
} from "../components/suppliers.js";
import {
    alerts
} from "../components/alerts.js";
import { bindPage } from "../events.js";

export function shell(title, number, content) {
    $("#section-number").textContent = `${number} / CONTROL`;
    $("#page-title").textContent = title;

    return content;
}

export function render() {
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
