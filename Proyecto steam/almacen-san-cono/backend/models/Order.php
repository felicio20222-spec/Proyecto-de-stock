<?php
class Order {
    public $id;
    public $number;
    public $supplier;
    public $status;
    public $date;
    public $total;
    public $items;

    public function __construct($data = []) {
        foreach ($data as $k => $v) {
            if (property_exists($this, $k)) $this->$k = $v;
        }
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'supplier' => $this->supplier,
            'status' => $this->status,
            'date' => $this->date,
            'total' => $this->total,
            'items' => $this->items,
        ];
    }
}
