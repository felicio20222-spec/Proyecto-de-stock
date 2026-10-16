<?php
class Sale {
    public $id;
    public $productId;
    public $product;
    public $cashier;
    public $quantity;
    public $total;
    public $date;

    public function __construct($data = []) {
        foreach ($data as $k => $v) {
            if (property_exists($this, $k)) $this->$k = $v;
        }
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'productId' => $this->productId,
            'product' => $this->product,
            'cashier' => $this->cashier,
            'quantity' => $this->quantity,
            'total' => $this->total,
            'date' => $this->date,
        ];
    }
}
