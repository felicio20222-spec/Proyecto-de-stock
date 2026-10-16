<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config/database.php';
require __DIR__ . '/controllers/StoreController.php';

$controller = new StoreController();
$action = $_GET['action'] ?? 'state';

switch ($action) {
    case 'state': $controller->state(); break;
    case 'save_product': $controller->saveProduct(); break;
    case 'toggle_product': $controller->toggleProduct(); break;
    case 'save_category': $controller->saveCategory(); break;
    case 'save_supplier': $controller->saveSupplier(); break;
    case 'sell': $controller->sell(); break;
    case 'register_purchase': $controller->registerPurchase(); break;
    case 'receive_order': $controller->receiveOrder(); break;
    default:
        http_response_code(400);
        out(['error' => 'Acción no válida.']);
}
