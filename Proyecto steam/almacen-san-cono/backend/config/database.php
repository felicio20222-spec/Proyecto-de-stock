<?php
// Configuración de persistencia (JSON)
$file = __DIR__ . '/../../database/data.json';

function readData() {
    global $file;
    $fp = fopen($file, 'r');
    if (!$fp) { http_response_code(500); out(['error' => 'No se pudo abrir data.json.']); }
    flock($fp, LOCK_SH);
    $data = json_decode(stream_get_contents($fp), true);
    flock($fp, LOCK_UN);
    fclose($fp);
    if (!is_array($data)) $data = [];
    $data['categories'] = $data['categories'] ?? [];
    $data['suppliers'] = $data['suppliers'] ?? [];
    $data['purchases'] = $data['purchases'] ?? [];
    $data['products'] = $data['products'] ?? [];
    $data['sales'] = $data['sales'] ?? [];
    $data['orders'] = $data['orders'] ?? [];
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

function out($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function nextId($items) {
    return empty($items) ? 1 : max(array_column($items, 'id')) + 1;
}
