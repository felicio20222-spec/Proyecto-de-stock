# Almacén San Cono — Control de stock

Aplicación web funcional hecha con **HTML/PHP + CSS + JavaScript**, con persistencia local en `data.json`.

## Incluye
- Dashboard con métricas, últimas ventas, top de productos y alertas.
- CRUD de productos y activar/desactivar.
- Modal de venta con cálculo en tiempo real y descuento de stock.
- Historial de ventas con filtros por fecha y producto/cajero.
- Órdenes de compra expandibles y recepción que actualiza el stock.
- Alertas separadas por sin stock y stock bajo.
- Diseño Swiss/funcional, responsive y con DM Sans + DM Mono.

## Ejecutar
Con PHP instalado:

```bash
php -S localhost:8000
```

Luego abrir `http://localhost:8000`.

> `data.json` se modifica automáticamente. Si querés restaurar los datos iniciales, reemplazá su contenido por una copia limpia del proyecto.

## Nota sobre TypeScript / App.tsx
El pedido mezcla dos arquitecturas: una aplicación HTML/CSS/JavaScript/PHP y, a la vez, tipos TypeScript exportados desde `App.tsx`. Esta versión prioriza el stack explícito **HTML + CSS + JavaScript + PHP**. Los conceptos `Product`, `Sale`, `PurchaseOrder`, `Category` y `Page` están representados por las estructuras de datos equivalentes en `data.json` y `app.js`.

Si el proyecto debe ser estrictamente React + TypeScript, se puede migrar esta misma interfaz a `App.tsx` y componentes separados.
