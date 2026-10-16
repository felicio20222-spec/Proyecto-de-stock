import { state } from "./core/state.js";
import { $ } from "./core/utils.js";
import { api } from "./core/api.js";
import { render } from "./core/render.js";
import { toast } from "./core/ui.js";
import {
    openProduct,
    openSell,
    openPurchase,
    openSupplier,
    openCategoryManager
} from "./components/modals.js";
import { renderProductRows } from "./components/products.js";
import { renderSales } from "./components/sales.js";

export function bindPage() {

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
                "¿Marcar esta orden como recibida y sumar " +
                "sus cantidades al stock?"
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
