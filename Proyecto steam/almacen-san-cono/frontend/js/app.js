import { state } from "./core/state.js";
import { $ } from "./core/utils.js";
import { api } from "./core/api.js";
import { render } from "./core/render.js";
import { hideModal } from "./core/ui.js";

async function refresh() {
    state.data = await api("state");
    render();
}

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
