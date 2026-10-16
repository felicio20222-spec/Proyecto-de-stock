<?php
class StoreController {
    public function state() {
        out(readData());
    }

    public function saveProduct() {
        $b = body();
        $p = [
            'id' => isset($b['id']) ? (int)$b['id'] : 0,
            'name' => trim($b['name'] ?? ''),
            'category' => trim($b['category'] ?? 'Bebidas'),
            'price' => (float)($b['price'] ?? 0),
            'stock' => (int)($b['stock'] ?? 0),
            'minStock' => (int)($b['minStock'] ?? 0),
            'active' => isset($b['active']) ? (bool)$b['active'] : true
        ];
        if ($p['name'] === '') { http_response_code(422); out(['error' => 'El nombre es obligatorio.']); }
        $data = readData();
        if ($p['id']) {
            $found = false;
            foreach ($data['products'] as &$old) {
                if ($old['id'] === $p['id']) {
                    $p['active'] = $old['active'];
                    $old = $p;
                    $found = true;
                    break;
                }
            }
            unset($old);
            if (!$found) { http_response_code(404); out(['error' => 'Producto no encontrado.']); }
        } else {
            $p['id'] = nextId($data['products']);
            $data['products'][] = $p;
        }
        if (!in_array($p['category'], $data['categories'], true)) $data['categories'][] = $p['category'];
        writeData($data);
        out($data);
    }

    public function toggleProduct() {
        $id = (int)($_GET['id'] ?? 0);
        $data = readData();
        foreach ($data['products'] as &$p) {
            if ($p['id'] === $id) $p['active'] = !$p['active'];
        }
        unset($p);
        writeData($data);
        out($data);
    }

    public function saveCategory() {
        $b = body();
        $name = trim($b['name'] ?? '');
        if ($name === '') { http_response_code(422); out(['error' => 'El nombre de la categoría es obligatorio.']); }
        $data = readData();
        foreach ($data['categories'] as $c) {
            if (mb_strtolower($c) === mb_strtolower($name)) {
                http_response_code(422); out(['error' => 'La categoría ya existe.']);
            }
        }
        $data['categories'][] = $name;
        writeData($data);
        out($data);
    }

    public function saveSupplier() {
        $b = body();
        $name = trim($b['name'] ?? '');
        if ($name === '') { http_response_code(422); out(['error' => 'El nombre de la distribuidora es obligatorio.']); }
        $data = readData();
        $id = isset($b['id']) ? (int)$b['id'] : 0;
        if ($id) {
            $found = false;
            foreach ($data['suppliers'] as &$s) {
                if ($s['id'] === $id) {
                    $s['name'] = $name;
                    $s['phone'] = trim($b['phone'] ?? '');
                    $s['contact'] = trim($b['contact'] ?? '');
                    $found = true;
                    break;
                }
            }
            unset($s);
            if (!$found) { http_response_code(404); out(['error' => 'Distribuidora no encontrada.']); }
        } else {
            $data['suppliers'][] = [
                'id' => nextId($data['suppliers']),
                'name' => $name,
                'phone' => trim($b['phone'] ?? ''),
                'contact' => trim($b['contact'] ?? '')
            ];
        }
        writeData($data);
        out($data);
    }

    public function sell() {
        $b = body();
        $id = (int)($b['productId'] ?? 0);
        $qty = (int)($b['quantity'] ?? 0);
        if ($qty < 1) { http_response_code(422); out(['error' => 'La cantidad debe ser mayor a 0.']); }
        $data = readData();
        $found = null;
        foreach ($data['products'] as &$p) {
            if ($p['id'] === $id) {
                if (!$p['active']) { http_response_code(422); out(['error' => 'El producto está inactivo.']); }
                if ($qty > $p['stock']) { http_response_code(422); out(['error' => 'No hay stock suficiente.']); }
                $p['stock'] -= $qty;
                $found = $p;
                break;
            }
        }
        unset($p);
        if (!$found) { http_response_code(404); out(['error' => 'Producto no encontrado.']); }
        $price = $found['price'];
        $sale = [
            'id' => nextId($data['sales']),
            'productId' => $id,
            'product' => $found['name'],
            'cashier' => $b['cashier'] ?? 'Laura M.',
            'quantity' => $qty,
            'total' => $qty * $price,
            'date' => date('Y-m-d')
        ];
        array_unshift($data['sales'], $sale);
        writeData($data);
        out($data);
    }

    public function registerPurchase() {
        $b = body();
        $productId = (int)($b['productId'] ?? 0);
        $qty = (int)($b['quantity'] ?? 0);
        $unitCost = (float)($b['unitCost'] ?? 0);
        $supplier = trim($b['supplier'] ?? '');
        if (!$productId || $qty < 1 || $unitCost < 0) {
            http_response_code(422); out(['error' => 'Producto, cantidad y costo son obligatorios.']);
        }
        $data = readData();
        $found = null;
        foreach ($data['products'] as &$p) {
            if ($p['id'] === $productId) { $p['stock'] += $qty; $found = $p; break; }
        }
        unset($p);
        if (!$found) { http_response_code(404); out(['error' => 'Producto no encontrado.']); }
        if ($supplier === '') $supplier = 'Sin distribuidora';
        $purchase = [
            'id' => nextId($data['purchases']),
            'productId' => $productId,
            'product' => $found['name'],
            'supplier' => $supplier,
            'quantity' => $qty,
            'unitCost' => $unitCost,
            'total' => $qty * $unitCost,
            'date' => date('Y-m-d')
        ];
        array_unshift($data['purchases'], $purchase);
        writeData($data);
        out($data);
    }

    public function receiveOrder() {
        $id = (int)($_GET['id'] ?? 0);
        $data = readData();
        foreach ($data['orders'] as &$o) {
            if ($o['id'] === $id && $o['status'] !== 'Recibido') {
                foreach ($o['items'] as $item) {
                    foreach ($data['products'] as &$p) {
                        if ($p['id'] === $item['productId']) $p['stock'] += (int)$item['quantity'];
                    }
                    unset($p);
                    $data['purchases'][] = [
                        'id' => nextId($data['purchases']),
                        'productId' => (int)$item['productId'],
                        'product' => $item['product'],
                        'supplier' => $o['supplier'],
                        'quantity' => (int)$item['quantity'],
                        'unitCost' => (float)$item['unitCost'],
                        'total' => (int)$item['quantity'] * (float)$item['unitCost'],
                        'date' => $o['date']
                    ];
                }
                $o['status'] = 'Recibido';
            }
        }
        unset($o);
        writeData($data);
        out($data);
    }
}
