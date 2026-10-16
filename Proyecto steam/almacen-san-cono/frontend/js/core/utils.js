// Utilidades compartidas (formato, escape, selector)
export const $ = (selector) => document.querySelector(selector);

export const money = (n) =>
    new Intl.NumberFormat("es-UY", {
        style: "currency",
        currency: "UYU",
        maximumFractionDigits: 0
    }).format(n);

export const dateFmt = (s) =>
    new Date(s + "T12:00:00").toLocaleDateString("es-UY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

export const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));
