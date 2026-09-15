<?php
header('Content-Type: application/json; charset=utf-8');
$file = __DIR__ . '/data.json';

function readData() {
    global $file;
    $fp = fopen($file, 'r');
    if (!$fp) http_response_code(500);
    flock($fp, LOCK_SH);
    $data = json_decode(stream_get_contents($fp), true);
    flock($fp, LOCK_UN);
    fclose($fp);
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
function body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
function out($data) { echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

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
            'category' => $b['category'] ?? 'Bebidas',
            'price' => (float)($b['price'] ?? 0),
            'stock' => (int)($b['stock'] ?? 0),
            'minStock' => (int)($b['minStock'] ?? 0),
            'active' => isset($b['active']) ? (bool)$b['active'] : true
        ];
        if ($p['name'] === '') { http_response_code(422); out(['error'=>'El nombre es obligatorio.']); }
        if ($p['id']) {
            foreach ($data['products'] as &$old) if ($old['id'] === $p['id']) { $p['active'] = $old['active']; $old = $p; }
            unset($old);
        } else {
            $p['id'] = max(array_column($data['products'], 'id')) + 1;
            $data['products'][] = $p;
        }
        writeData($data); out($data);

    case 'toggle_product':
        $id = (int)($_GET['id'] ?? 0);
        foreach ($data['products'] as &$p) if ($p['id'] === $id) $p['active'] = !$p['active'];
        unset($p);
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
            'id' => empty($data['sales']) ? 1 : max(array_column($data['sales'], 'id')) + 1,
            'productId' => $id, 'product' => $found['name'], 'cashier' => $b['cashier'] ?? 'Laura M.',
            'quantity' => $qty, 'total' => $qty * $price, 'date' => date('Y-m-d')
        ];
        array_unshift($data['sales'], $sale);
        writeData($data); out($data);

    case 'receive_order':
        $id = (int)($_GET['id'] ?? 0);
        foreach ($data['orders'] as &$o) {
            if ($o['id'] === $id && $o['status'] !== 'Recibido') {
                foreach ($o['items'] as $item) {
                    foreach ($data['products'] as &$p) if ($p['id'] === $item['productId']) $p['stock'] += (int)$item['quantity'];
                    unset($p);
                }
                $o['status'] = 'Recibido';
            }
        }
        unset($o);
        writeData($data); out($data);

    default:
        http_response_code(400); out(['error'=>'Acción no válida.']);
}