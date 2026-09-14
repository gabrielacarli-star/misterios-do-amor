<?php
$db_file = __DIR__ . '/templo.sqlite';
$db = new SQLite3($db_file);
$db->exec("CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    session_id TEXT,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");
?>
