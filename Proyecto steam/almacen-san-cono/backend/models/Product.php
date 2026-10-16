<?php
class Product {
    public $id;
    public $name;
    public $category;
    public $price;
    public $stock;
    public $minStock;
    public $active;

    public function __construct($data = []) {
        foreach ($data as $k => $v) {
            if (property_exists($this, $k)) $this->$k = $v;
        }
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'price' => $this->price,
            'stock' => $this->stock,
            'minStock' => $this->minStock,
            'active' => $this->active,
        ];
    }
}
