<?php
require 'db.php';
$email = $_GET['email'] ?? '';
$session_id = $_GET['session_id'] ?? '';

if (!$email && !$session_id) {
    echo json_encode(['purchases' => []]);
    exit;
}

$query = "SELECT product_id FROM purchases WHERE ";
$params = [];
if ($email && $session_id) {
    $query .= "email = :e OR session_id = :s";
    $params[':e'] = strtolower(trim($email));
    $params[':s'] = $session_id;
} elseif ($email) {
    $query .= "email = :e";
    $params[':e'] = strtolower(trim($email));
} else {
    $query .= "session_id = :s";
    $params[':s'] = $session_id;
}

$stmt = $db->prepare($query);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v, SQLITE3_TEXT);
}
$res = $stmt->execute();

$purchases = [];
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    $purchases[] = $row['product_id'];
}
echo json_encode(['purchases' => $purchases]);
?>
