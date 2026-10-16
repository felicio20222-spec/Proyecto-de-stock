import { state } from "../core/state.js";
import { esc } from "../core/utils.js";

export function suppliers() {
    const list = state.data.suppliers || [];
    return `
        <div class="toolbar">
            <div>
                <span class="eyebrow">PROVEEDORES</span>
                <h2>Distribuidoras</h2>
            </div>
            <button class="primary" id="new-supplier">
                + Nueva distribuidora
            </button>
        </div>

        <section class="panel">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Contacto</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(s => `
                            <tr>
                                <td><strong>${esc(s.name)}</strong></td>
                                <td>${esc(s.contact || "—")}</td>
                                <td>${esc(s.phone || "—")}</td>
                                <td>
                                    <button
                                        class="small"
                                        data-edit-supplier="${s.id}"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        `).join("") || `
                            <tr>
                                <td colspan="4">
                                    <div class="empty">
                                        No hay distribuidoras registradas.
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
