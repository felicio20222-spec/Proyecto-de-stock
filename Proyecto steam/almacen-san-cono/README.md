# Almacén San Cono — Control de stock

Aplicación web funcional hecha con **HTML/CSS + JavaScript (ES Modules) + PHP (MVC)**, con persistencia local en `database/data.json`.

## Arquitectura

```
almacen-san-cono/
├── index.html                 # Redirección a frontend/html/index.html
├── frontend/                  # CAPA DE PRESENTACIÓN
│   ├── html/
│   │   └── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js            # Punto de entrada
│   │   ├── core/             # Estado, utilidades, API, render, UI
│   │   ├── components/       # Vistas (dashboard, products, ...)
│   │   └── events.js         # Binding de eventos por página
│   └── assets/               # Imágenes, iconos y recursos
├── backend/                   # CAPA DE SERVIDOR (MVC)
│   ├── index.php             # Front controller
│   ├── config/
│   │   └── database.php      # Acceso a data.json
│   ├── controllers/
│   │   └── StoreController.php
│   └── models/               # Entidades (Product, Sale, ...)
├── database/
│   ├── data.json             # Persistencia
│   └── schema.sql            # Esquema SQL de referencia
├── docs/
│   └── architecture.md
└── README.md
```

## Ejecutar
Con PHP instalado, desde la raíz del proyecto:

```bash
php -S localhost:8000
```

Luego abrir `http://localhost:8000`.

> `database/data.json` se modifica automáticamente.
