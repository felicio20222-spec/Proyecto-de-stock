// Comunicación con la API (api.php)
export async function api(action, options = {}) {
    const r = await fetch(
        `/backend/index.php?action=${action}${options.query || ""}`,
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
