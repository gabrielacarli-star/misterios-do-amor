<?php
require 'db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) { $data = $_POST; }

file_put_contents(__DIR__ . '/webhook_log.txt', date('Y-m-d H:i:s') . " - " . json_encode($data) . "\n", FILE_APPEND);

// Cakto payload wraps everything in a "data" object
$eventData = isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;

$email = '';
if (isset($eventData['customer']['email'])) $email = $eventData['customer']['email'];
elseif (isset($eventData['email'])) $email = $eventData['email'];

$session_id = '';
if (isset($eventData['utm_campaign'])) $session_id = $eventData['utm_campaign'];
elseif (isset($_GET['session'])) $session_id = $_GET['session'];

$status = strtolower($eventData['status'] ?? $eventData['status_transacao'] ?? 'approved');
$product_id = $eventData['offer']['id'] ?? $eventData['product']['short_id'] ?? $eventData['product_id'] ?? $eventData['offer'] ?? 'unknown';

if ($email && ($status === 'approved' || $status === 'paid' || $status === 'completed' || $status === 'aprovado' || $status === 'pago')) {
    $stmt = $db->prepare("INSERT INTO purchases (email, session_id, product_id, status) VALUES (:e, :s, :p, :st)");
    $stmt->bindValue(':e', strtolower(trim($email)), SQLITE3_TEXT);
    $stmt->bindValue(':s', $session_id, SQLITE3_TEXT);
    $stmt->bindValue(':p', $product_id, SQLITE3_TEXT);
    $stmt->bindValue(':st', $status, SQLITE3_TEXT);
    $stmt->execute();
    echo "OK";
} else {
    echo "Ignored: No Email or Status Pending";
}
?>
