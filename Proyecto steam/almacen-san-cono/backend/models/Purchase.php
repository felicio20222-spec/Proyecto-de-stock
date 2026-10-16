<?php
class Purchase {
    public $id;
    public $productId;
    public $product;
    public $supplier;
    public $quantity;
    public $unitCost;
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
            'supplier' => $this->supplier,
            'quantity' => $this->quantity,
            'unitCost' => $this->unitCost,
            'total' => $this->total,
            'date' => $this->date,
        ];
    }
}
