<?php
class Supplier {
    public $id;
    public $name;
    public $phone;
    public $contact;

    public function __construct($data = []) {
        foreach ($data as $k => $v) {
            if (property_exists($this, $k)) $this->$k = $v;
        }
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'contact' => $this->contact,
        ];
    }
}
