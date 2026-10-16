-- Esquema equivalente (referencia). La app usa data.json, pero este SQL documenta la estructura.
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock INT,
    minStock INT,
    active BOOLEAN
);

CREATE TABLE sales (
    id INT PRIMARY KEY,
    productId INT,
    product VARCHAR(255),
    cashier VARCHAR(100),
    quantity INT,
    total DECIMAL(10,2),
    date DATE
);

CREATE TABLE purchases (
    id INT PRIMARY KEY,
    productId INT,
    product VARCHAR(255),
    supplier VARCHAR(255),
    quantity INT,
    unitCost DECIMAL(10,2),
    total DECIMAL(10,2),
    date DATE
);

CREATE TABLE orders (
    id INT PRIMARY KEY,
    number VARCHAR(50),
    supplier VARCHAR(255),
    status VARCHAR(50),
    date DATE,
    total DECIMAL(10,2)
);

CREATE TABLE order_items (
    id INT PRIMARY KEY,
    orderId INT,
    productId INT,
    product VARCHAR(255),
    quantity INT,
    unitCost DECIMAL(10,2)
);

CREATE TABLE suppliers (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    contact VARCHAR(255)
);

CREATE TABLE categories (
    name VARCHAR(100) PRIMARY KEY
);
