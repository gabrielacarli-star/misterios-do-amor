<?php
declare(strict_types=1);

require __DIR__ . '/connectpay-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'Método não permitido.'], 405);
}

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($payload)) {
    json_response(['ok' => false, 'error' => 'JSON inválido.'], 400);
}

$transactionId = (string)($payload['id'] ?? '');
$externalId = (string)($payload['external_id'] ?? '');
$status = strtoupper((string)($payload['status'] ?? ''));

$store = read_store();
$updated = false;
foreach ($store['transactions'] ?? [] as &$transaction) {
    if (($externalId !== '' && ($transaction['external_id'] ?? '') === $externalId) ||
        ($transactionId !== '' && ($transaction['transaction_id'] ?? '') === $transactionId)) {
        $transaction['status'] = $status ?: ($transaction['status'] ?? 'PENDING');
        if (!isset($transaction['amount'])) {
            $transaction['amount'] = $payload['total_amount'] ?? $payload['amount'] ?? $payload['total_value'] ?? null;
        }
        if (!isset($transaction['package'])) {
            $transaction['package'] = package_from_amount($transaction['amount'] ?? 20);
        }
        $transaction['webhook_payloads'][] = $payload;
        $transaction['updated_at'] = date('c');
        $updated = true;
        break;
    }
}
unset($transaction);

if (!$updated) {
    $amount = $payload['total_amount'] ?? $payload['amount'] ?? $payload['total_value'] ?? null;
    $store['transactions'][] = [
        'external_id' => $externalId,
        'transaction_id' => $transactionId,
        'status' => $status ?: 'UNKNOWN',
        'amount' => $amount,
        'package' => package_from_amount($amount ?? 15),
        'payment_method' => $payload['payment_method'] ?? null,
        'created_at' => date('c'),
        'updated_at' => date('c'),
        'webhook_payloads' => [$payload],
    ];
}

write_store($store);
if ($status === 'AUTHORIZED') {
    $latest = null;
    foreach ($store['transactions'] ?? [] as $transaction) {
        if (($externalId !== '' && ($transaction['external_id'] ?? '') === $externalId) ||
            ($transactionId !== '' && ($transaction['transaction_id'] ?? '') === $transactionId)) {
            $latest = $transaction;
            break;
        }
    }
    if ($latest) {
        register_paid_order($latest);
    }
}
json_response(['ok' => true]);
