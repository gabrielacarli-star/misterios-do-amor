<?php
declare(strict_types=1);

require __DIR__ . '/connectpay-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'Método não permitido.'], 405);
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    json_response(['ok' => false, 'error' => 'JSON inválido.'], 400);
}

$amount = (float)($input['amount'] ?? 0);
$phone = only_digits((string)($input['phone'] ?? ''));
$name = trim((string)($input['name'] ?? ''));
$ente = trim((string)($input['ente'] ?? ''));
$letter = trim((string)($input['letter'] ?? ''));
$packageOverride = $input['package_override'] ?? null;
$trackingInput = $input['tracking'] ?? [];
$tracking = [];
$customerTrackingFields = ['fbc', 'fbp', '_fbc', '_fbp'];

if (!is_array($trackingInput)) {
    $trackingInput = [];
}

foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'fbc', 'fbp', '_fbc', '_fbp', 'gclid', 'ttclid', 'xcod', 'sck', 'click_id', 'click_type'] as $trackingField) {
    $trackingValue = trim((string)($trackingInput[$trackingField] ?? $input[$trackingField] ?? ''));
    if ($trackingValue !== '') {
        $tracking[$trackingField] = $trackingValue;
    }
}

if (!isset($tracking['fbc']) && isset($tracking['_fbc'])) {
    $tracking['fbc'] = $tracking['_fbc'];
}

if (!isset($tracking['fbp']) && isset($tracking['_fbp'])) {
    $tracking['fbp'] = $tracking['_fbp'];
}

if ($amount < 1) {
    json_response(['ok' => false, 'error' => 'Valor inválido.'], 400);
}

if (strlen($phone) < 10) {
    $phone = '11900000000';
}

if ($name === '') {
    $name = 'Cliente Templo da Luz Amorosa';
}

$package = package_from_amount($amount);
if (is_array($packageOverride) && isset($packageOverride['title'])) {
    $package = array_merge($package, $packageOverride);
}
$packageTitle = $package['title'];
$packageDescription = $package['description'];

$billingName = 'Alessandro Pereira Coimbra';
$billingDocument = '01780101627';
$externalId = 'tdl_' . date('YmdHis') . '_' . bin2hex(random_bytes(4));
$email = 'cliente_' . substr($phone, -11) . '@templodaluz.larequilibrado.com';
$document = $billingDocument;
$webhookUrl = site_base_url() . '/checkout-webhook.php';

$payload = [
    'external_id' => $externalId,
    'total_amount' => round($amount, 2),
    'payment_method' => 'PIX',
    'webhook_url' => $webhookUrl,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    'items' => [[
        'id' => 'tarot_amoroso_' . str_replace('.', '_', (string)$amount),
        'title' => $packageTitle,
        'description' => $packageDescription,
        'price' => round($amount, 2),
        'quantity' => 1,
        'is_physical' => false,
    ]],
    'customer' => [
        'name' => $billingName,
        'email' => $email,
        'phone' => $phone,
        'document_type' => 'CPF',
        'document' => $document,
    ],
];

foreach ($customerTrackingFields as $field) {
    unset($payload['customer'][$field]);
}

$body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$url = CONNECTPAY_API_BASE . '/v1/transactions';
$httpCode = 0;
$response = false;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'api-secret: ' . CONNECTPAY_API_SECRET,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_TIMEOUT => 25,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false || $curlError) {
        json_response(['ok' => false, 'error' => 'Falha ao conectar com a ConnectPay.', 'detail' => $curlError], 502);
    }
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "api-secret: " . CONNECTPAY_API_SECRET . "\r\nContent-Type: application/json\r\n",
            'content' => $body,
            'timeout' => 25,
            'ignore_errors' => true,
        ],
    ]);
    $response = file_get_contents($url, false, $context);
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
        $httpCode = (int)$matches[1];
    }
}

if ($response === false) {
    json_response(['ok' => false, 'error' => 'Falha ao conectar com a ConnectPay.'], 502);
}

$api = json_decode((string)$response, true);
if ($httpCode < 200 || $httpCode >= 300 || !is_array($api)) {
    $apiMessage = '';
    if (is_array($api)) {
        $apiMessage = (string)($api['message'] ?? $api['error'] ?? $api['detail'] ?? '');
    }

    json_response([
        'ok' => false,
        'error' => $apiMessage !== '' ? $apiMessage : 'A ConnectPay recusou a criação do PIX.',
        'status' => $httpCode,
        'response' => $api ?: $response,
    ], 502);
}

$pixPayload = (string)($api['pix']['payload'] ?? $api['payload'] ?? $api['pix_payload'] ?? $api['qr_code'] ?? '');
$transactionId = (string)($api['id'] ?? $api['transaction_id'] ?? '');
$status = (string)($api['status'] ?? 'PENDING');

if ($pixPayload === '' || $transactionId === '') {
    json_response(['ok' => false, 'error' => 'A ConnectPay não retornou o PIX esperado.', 'response' => $api], 502);
}

$store = read_store();
$store['transactions'][] = [
    'external_id' => $externalId,
    'transaction_id' => $transactionId,
    'status' => $status,
    'amount' => round($amount, 2),
    'payment_method' => 'PIX',
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'document' => $document,
    'ente' => $ente,
    'letter' => $letter,
    'package_title' => $packageTitle,
    'package_description' => $packageDescription,
    'package' => $package,
    'tracking' => $tracking,
    'created_at' => date('c'),
    'updated_at' => date('c'),
    'api_response' => $api,
];
write_store($store);

if (strtoupper($status) === 'AUTHORIZED') {
    register_paid_order(end($store['transactions']) ?: []);
}

json_response([
    'ok' => true,
    'external_id' => $externalId,
    'transaction_id' => $transactionId,
    'status' => $status,
    'amount' => round($amount, 2),
    'pix_payload' => $pixPayload,
]);
