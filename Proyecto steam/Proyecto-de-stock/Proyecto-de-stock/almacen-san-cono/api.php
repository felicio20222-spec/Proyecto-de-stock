<?php
header('Content-Type: application/json; charset=utf-8');
$file = __DIR__ . '/data.json';

function readData() {
    global $file;
    $fp = fopen($file, 'r');
    if (!$fp) { http_response_code(500); out(['error'=>'No se pudo abrir data.json.']); }
    flock($fp, LOCK_SH);
    $data = json_decode(stream_get_contents($fp), true);
    flock($fp, LOCK_UN);
    fclose($fp);
    if (!is_array($data)) $data = [];
    $data['categories'] = $data['categories'] ?? [];
    $data['suppliers'] = $data['suppliers'] ?? [];
    $data['purchases'] = $data['purchases'] ?? [];
    return $data;
}
function writeData($data) {
    global $file;
    $fp = fopen($file, 'c+');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}
function body() { return json_decode(file_get_contents('php://input'), true) ?? []; }
function out($data) { echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function nextId($items) { return empty($items) ? 1 : max(array_column($items, 'id')) + 1; }

$action = $_GET['action'] ?? 'state';
$data = readData();

switch ($action) {
    case 'state':
        out($data);

    case 'save_product':
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
        if ($p['name'] === '') { http_response_code(422); out(['error'=>'El nombre es obligatorio.']); }
        if ($p['id']) {
            $found = false;
            foreach ($data['products'] as &$old) if ($old['id'] === $p['id']) {
                $p['active'] = $old['active'];
                $old = $p; $found = true;
            }
            unset($old);
            if (!$found) { http_response_code(404); out(['error'=>'Producto no encontrado.']); }
        } else {
            $p['id'] = nextId($data['products']);
            $data['products'][] = $p;
        }
        if (!in_array($p['category'], $data['categories'], true)) $data['categories'][] = $p['category'];
        writeData($data); out($data);

    case 'toggle_product':
        $id = (int)($_GET['id'] ?? 0);
        foreach ($data['products'] as &$p) if ($p['id'] === $id) $p['active'] = !$p['active'];
        unset($p);
        writeData($data); out($data);

    case 'save_category':
        $b = body(); $name = trim($b['name'] ?? '');
        if ($name === '') { http_response_code(422); out(['error'=>'El nombre de la categoría es obligatorio.']); }
        foreach ($data['categories'] as $c) if (mb_strtolower($c) === mb_strtolower($name)) {
            http_response_code(422); out(['error'=>'La categoría ya existe.']);
        }
        $data['categories'][] = $name;
        writeData($data); out($data);

    case 'save_supplier':
        $b = body(); $name = trim($b['name'] ?? '');
        if ($name === '') { http_response_code(422); out(['error'=>'El nombre de la distribuidora es obligatorio.']); }
        $id = isset($b['id']) ? (int)$b['id'] : 0;
        if ($id) {
            $found = false;
            foreach ($data['suppliers'] as &$s) if ($s['id'] === $id) {
                $s['name'] = $name; $s['phone'] = trim($b['phone'] ?? ''); $s['contact'] = trim($b['contact'] ?? '');
                $found = true;
            }
            unset($s);
            if (!$found) { http_response_code(404); out(['error'=>'Distribuidora no encontrada.']); }
        } else {
            $data['suppliers'][] = [
                'id'=>nextId($data['suppliers']), 'name'=>$name,
                'phone'=>trim($b['phone'] ?? ''), 'contact'=>trim($b['contact'] ?? '')
            ];
        }
        writeData($data); out($data);

    case 'sell':
        $b = body(); $id = (int)($b['productId'] ?? 0); $qty = (int)($b['quantity'] ?? 0);
        if ($qty < 1) { http_response_code(422); out(['error'=>'La cantidad debe ser mayor a 0.']); }
        $found = null;
        foreach ($data['products'] as &$p) {
            if ($p['id'] === $id) {
                if (!$p['active']) { http_response_code(422); out(['error'=>'El producto está inactivo.']); }
                if ($qty > $p['stock']) { http_response_code(422); out(['error'=>'No hay stock suficiente.']); }
                $p['stock'] -= $qty; $found = $p;
            }
        }
        unset($p);
        if (!$found) { http_response_code(404); out(['error'=>'Producto no encontrado.']); }
        $price = $found['price'];
        $sale = [
            'id' => nextId($data['sales']), 'productId' => $id, 'product' => $found['name'],
            'cashier' => $b['cashier'] ?? 'Laura M.', 'quantity' => $qty,
            'total' => $qty * $price, 'date' => date('Y-m-d')
        ];
        array_unshift($data['sales'], $sale);
        writeData($data); out($data);

    case 'register_purchase':
        $b = body();
        $productId = (int)($b['productId'] ?? 0);
        $qty = (int)($b['quantity'] ?? 0);
        $unitCost = (float)($b['unitCost'] ?? 0);
        $supplier = trim($b['supplier'] ?? '');
        if (!$productId || $qty < 1 || $unitCost < 0) { http_response_code(422); out(['error'=>'Producto, cantidad y costo son obligatorios.']); }
        $found = null;
        foreach ($data['products'] as &$p) if ($p['id'] === $productId) { $p['stock'] += $qty; $found = $p; }
        unset($p);
        if (!$found) { http_response_code(404); out(['error'=>'Producto no encontrado.']); }
        if ($supplier === '') $supplier = 'Sin distribuidora';
        $purchase = [
            'id'=>nextId($data['purchases']), 'productId'=>$productId, 'product'=>$found['name'],
            'supplier'=>$supplier, 'quantity'=>$qty, 'unitCost'=>$unitCost,
            'total'=>$qty*$unitCost, 'date'=>date('Y-m-d')
        ];
        array_unshift($data['purchases'], $purchase);
        writeData($data); out($data);

    case 'receive_order':
        $id = (int)($_GET['id'] ?? 0);
        foreach ($data['orders'] as &$o) {
            if ($o['id'] === $id && $o['status'] !== 'Recibido') {
                foreach ($o['items'] as $item) {
                    foreach ($data['products'] as &$p) if ($p['id'] === $item['productId']) $p['stock'] += (int)$item['quantity'];
                    unset($p);
                    $data['purchases'][] = [
                        'id'=>nextId($data['purchases']),
                        'productId'=>(int)$item['productId'],
                        'product'=>$item['product'],
                        'supplier'=>$o['supplier'],
                        'quantity'=>(int)$item['quantity'],
                        'unitCost'=>(float)$item['unitCost'],
                        'total'=>(int)$item['quantity'] * (float)$item['unitCost'],
                        'date'=>$o['date']
                    ];
                }
                $o['status'] = 'Recibido';
            }
        }
        unset($o);
        writeData($data); out($data);

    default:
        http_response_code(400); out(['error'=>'Acción no válida.']);
}
