# Arquitectura del proyecto

## Frontend
SPA en HTML/CSS/JS (ES Modules). `frontend/js/core` contiene estado, utilidades, comunicación con la API, renderizado y UI. `frontend/js/components` contiene una vista por archivo. `frontend/js/events.js` enlaza eventos según la página activa.

## Backend
PHP con patrón MVC simplificado:
- `backend/index.php` es el front controller: lee `action` y delega a `StoreController`.
- `backend/config/database.php` encapsula lectura/escritura de `database/data.json`.
- `backend/controllers/StoreController.php` contiene la lógica de negocio.
- `backend/models/` define las entidades del dominio.

## Persistencia
Se usa `database/data.json` (JSON). `database/schema.sql` documenta el esquema relacional equivalente.
