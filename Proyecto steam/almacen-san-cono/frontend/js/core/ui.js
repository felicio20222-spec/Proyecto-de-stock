import { $ } from "./utils.js";

export function showModal() {
    $("#modal-backdrop").classList.remove("hidden");
}

export function hideModal() {
    $("#modal-backdrop").classList.add("hidden");
}

export function toast(msg, error = false) {
    const t = $("#toast");

    t.textContent = msg;
    t.className = "toast show" + (error ? " error" : "");

    setTimeout(() => {
        t.className = "toast";
    }, 2600);
}
