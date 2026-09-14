<?php
declare(strict_types=1);

require __DIR__ . '/connectpay-config.php';

$externalId = (string)($_GET['external_id'] ?? '');
$transactionId = (string)($_GET['transaction_id'] ?? '');

if ($externalId === '' && $transactionId === '') {
    json_response(['ok' => false, 'error' => 'Pedido não informado.'], 400);
}

$store = read_store();
$found = null;
$foundIndex = null;
foreach ($store['transactions'] ?? [] as $index => $transaction) {
    if (($externalId !== '' && ($transaction['external_id'] ?? '') === $externalId) ||
        ($transactionId !== '' && ($transaction['transaction_id'] ?? '') === $transactionId)) {
        $found = $transaction;
        $foundIndex = $index;
        break;
    }
}

if (!$found) {
    $paidOrders = read_paid_orders();
    $paidKey = $externalId !== '' ? $externalId : $transactionId;
    if ($paidKey !== '' && isset($paidOrders['orders'][$paidKey])) {
        $paidOrder = $paidOrders['orders'][$paidKey];
        json_response([
            'ok' => true,
            'paid' => true,
            'status' => 'AUTHORIZED',
            'external_id' => $paidOrder['external_id'] ?? $externalId,
            'transaction_id' => $paidOrder['transaction_id'] ?? $transactionId,
            'amount' => $paidOrder['amount'] ?? null,
            'package' => $paidOrder['package'] ?? package_from_amount($paidOrder['amount'] ?? 20),
        ]);
    }

    $api = connectpay_get_transaction($transactionId);
    if (!$api) {
        json_response(['ok' => true, 'paid' => false, 'status' => 'PENDING']);
    }

    $status = strtoupper((string)($api['status'] ?? 'PENDING'));
    $amount = $api['amount'] ?? $api['total_value'] ?? null;
    $newTransaction = [
        'external_id' => (string)($api['external_id'] ?? $externalId),
        'transaction_id' => (string)($api['id'] ?? $transactionId),
        'status' => $status,
        'amount' => $amount,
        'package' => package_from_amount($amount ?? 20),
        'payment_method' => $api['payment_method'] ?? 'PIX',
        'created_at' => $api['created_at'] ?? date('c'),
        'updated_at' => date('c'),
        'api_status_response' => $api,
    ];
    $store['transactions'][] = $newTransaction;
    write_store($store);
    if ($status === 'AUTHORIZED') {
        register_paid_order($newTransaction);
    }

    json_response([
        'ok' => true,
        'paid' => $status === 'AUTHORIZED',
        'status' => $status,
        'external_id' => (string)($api['external_id'] ?? $externalId),
        'transaction_id' => (string)($api['id'] ?? $transactionId),
        'amount' => $amount,
        'package' => package_from_amount($amount ?? 20),
    ]);
}

$status = strtoupper((string)($found['status'] ?? 'PENDING'));
if ($status !== 'AUTHORIZED' && $transactionId !== '') {
    $api = connectpay_get_transaction($transactionId);
    if ($api) {
        $apiStatus = strtoupper((string)($api['status'] ?? $status));
        if ($foundIndex !== null && isset($store['transactions'][$foundIndex])) {
            $store['transactions'][$foundIndex]['status'] = $apiStatus;
            $store['transactions'][$foundIndex]['updated_at'] = date('c');
            $store['transactions'][$foundIndex]['api_status_response'] = $api;
            if (!isset($store['transactions'][$foundIndex]['package'])) {
                $store['transactions'][$foundIndex]['package'] = package_from_amount($store['transactions'][$foundIndex]['amount'] ?? 20);
            }
            write_store($store);
            if ($apiStatus === 'AUTHORIZED') {
                register_paid_order($store['transactions'][$foundIndex]);
            }
        }
        $status = $apiStatus;
    }
}

if ($status === 'AUTHORIZED') {
    register_paid_order($found);
}

json_response([
    'ok' => true,
    'paid' => $status === 'AUTHORIZED',
    'status' => $status,
    'external_id' => $found['external_id'] ?? null,
    'transaction_id' => $found['transaction_id'] ?? null,
    'amount' => $found['amount'] ?? null,
    'package_title' => $found['package_title'] ?? null,
    'package_description' => $found['package_description'] ?? null,
    'package' => $found['package'] ?? package_from_amount($found['amount'] ?? 20),
]);
