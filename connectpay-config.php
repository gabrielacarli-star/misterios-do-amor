<?php
declare(strict_types=1);

$rawSecret = getenv('CONNECTPAY_API_SECRET') ?: ($_ENV['CONNECTPAY_API_SECRET'] ?? '');
$rawRecipient = getenv('CONNECTPAY_RECIPIENT_ID') ?: ($_ENV['CONNECTPAY_RECIPIENT_ID'] ?? '');
$rawUtmifyToken = getenv('UTMIFY_API_TOKEN') ?: ($_ENV['UTMIFY_API_TOKEN'] ?? '');

if ((!$rawSecret || !$rawRecipient || !$rawUtmifyToken) && file_exists(__DIR__ . '/.env')) {
    $envLines = @file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (is_array($envLines)) {
        foreach ($envLines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $k = trim($k);
                $v = trim(trim($v), "\"'");
                if ($k === 'CONNECTPAY_API_SECRET' && !$rawSecret) $rawSecret = $v;
                if ($k === 'CONNECTPAY_RECIPIENT_ID' && !$rawRecipient) $rawRecipient = $v;
                if ($k === 'UTMIFY_API_TOKEN' && !$rawUtmifyToken) $rawUtmifyToken = $v;
            }
        }
    }
}

define('CONNECTPAY_API_BASE', 'https://api.connectpay.vc');
define('CONNECTPAY_API_SECRET', $rawSecret);
define('CONNECTPAY_RECIPIENT_ID', $rawRecipient);
define('UTMIFY_API_TOKEN', $rawUtmifyToken);
define('UTMIFY_API_BASE', 'https://api.utmify.com.br');
define('SITE_BASE_URL', getenv('SITE_BASE_URL') ?: 'https://templodaluz.larequilibrado.com');
define('DATA_FILE', __DIR__ . '/data.json');
define('PAID_ORDERS_FILE', __DIR__ . '/paid-orders.json');
define('UTMIFY_LOG_FILE', __DIR__ . '/utmify_log.txt');

function site_base_url(): string
{
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host !== '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        return $scheme . '://' . $host . ($dir && $dir !== '/' ? $dir : '');
    }

    return SITE_BASE_URL;
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_store(): array
{
    if (!file_exists(DATA_FILE)) {
        return ['transactions' => []];
    }

    $raw = file_get_contents(DATA_FILE);
    $data = $raw ? json_decode($raw, true) : null;

    return is_array($data) ? $data : ['transactions' => []];
}

function write_store(array $data): void
{
    $fp = fopen(DATA_FILE, 'c+');
    if (!$fp) {
        json_response(['ok' => false, 'error' => 'Não foi possível abrir o arquivo de dados.'], 500);
    }

    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function package_from_amount($amount): array
{
    $amount = (float)$amount;
    if ($amount >= 59.99) {
        return [
            'amount' => 60,
            'title' => 'Pacote Sagrado VIP - Tudo Incluso',
            'questions' => 20,
            'oraculo_days' => 90,
            'has_amarracao' => true,
            'has_palm_reading' => true,
            'sessions' => 3,
            'description' => 'Tudo incluso com prioridade máxima, oráculo 90 dias e acompanhamento vip',
        ];
    }
    if ($amount >= 54.99) {
        return [
            'amount' => 55,
            'title' => 'Leitura Completa com Terceira Pessoa',
            'questions' => 10,
            'oraculo_days' => 60,
            'has_amarracao' => true,
            'has_palm_reading' => true,
            'description' => '10 respostas, revelação de rivais/terceira pessoa e oráculo 60 dias',
        ];
    }
    if ($amount >= 44.99) {
        return [
            'amount' => 45,
            'title' => 'Amarração Amorosa com Leitura da Mão',
            'questions' => 7,
            'oraculo_days' => 30,
            'has_amarracao' => true,
            'has_palm_reading' => true,
            'description' => '7 respostas, amarração amorosa e leitura das linhas da mão',
        ];
    }
    if ($amount >= 34.99) {
        return [
            'amount' => 35,
            'title' => 'Amarração Amorosa com 5 Respostas',
            'questions' => 5,
            'oraculo_days' => 30,
            'has_amarracao' => true,
            'description' => '5 respostas e amarração amorosa de 3 a 7 dias (Mais Vantajosa)',
        ];
    }
    if ($amount >= 24.99) {
        return [
            'amount' => 25,
            'title' => 'Leitura Amorosa com Oráculo',
            'questions' => 5,
            'oraculo_days' => 30,
            'has_amarracao' => false,
            'description' => '5 respostas, leitura de cartas e 30 dias de oráculo do futuro',
        ];
    }
    return [
        'amount' => 15,
        'title' => 'Leitura Amorosa Essencial',
        'questions' => 3,
        'oraculo_days' => 0,
        'has_amarracao' => false,
        'description' => '3 respostas e leitura de carta amorosa imediata',
    ];
}

function read_paid_orders(): array
{
    if (!file_exists(PAID_ORDERS_FILE)) {
        return ['orders' => []];
    }

    $raw = file_get_contents(PAID_ORDERS_FILE);
    $data = $raw ? json_decode($raw, true) : null;

    return is_array($data) ? $data : ['orders' => []];
}

function write_paid_orders(array $data): void
{
    $fp = fopen(PAID_ORDERS_FILE, 'c+');
    if (!$fp) {
        json_response(['ok' => false, 'error' => 'Não foi possível abrir o arquivo de pedidos pagos.'], 500);
    }

    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function register_paid_order(array $transaction): void
{
    $externalId = (string)($transaction['external_id'] ?? '');
    $transactionId = (string)($transaction['transaction_id'] ?? '');
    if ($externalId === '' && $transactionId === '') {
        return;
    }

    $amount = $transaction['amount'] ?? $transaction['total_amount'] ?? $transaction['total_value'] ?? 20;
    $package = package_from_amount($amount);
    $orders = read_paid_orders();
    $key = $externalId !== '' ? $externalId : $transactionId;

    $record = [
        'external_id' => $externalId,
        'transaction_id' => $transactionId,
        'status' => 'AUTHORIZED',
        'amount' => round((float)$amount, 2),
        'package' => $package,
        'name' => $transaction['name'] ?? null,
        'phone' => $transaction['phone'] ?? null,
        'email' => $transaction['email'] ?? null,
        'ente' => $transaction['ente'] ?? null,
        'updated_at' => date('c'),
    ];
    $orders['orders'][$key] = $record;
    if ($externalId !== '') {
        $orders['orders'][$externalId] = $record;
    }
    if ($transactionId !== '') {
        $orders['orders'][$transactionId] = $record;
    }

    write_paid_orders($orders);
    utmify_report_order($transaction, $record);
}

function utmify_log(string $message): void
{
    @file_put_contents(UTMIFY_LOG_FILE, '[' . date('c') . '] ' . $message . "\n", FILE_APPEND);
}

function utmify_iso_to_datetime(?string $iso): string
{
    if (!$iso) {
        return date('Y-m-d H:i:s');
    }
    $timestamp = strtotime($iso);
    return $timestamp ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
}

function utmify_report_order(array $transaction, array $record): void
{
    if (UTMIFY_API_TOKEN === '') {
        return;
    }

    $externalId = (string)($record['external_id'] ?? '');
    $transactionId = (string)($record['transaction_id'] ?? '');
    $orderId = $externalId !== '' ? $externalId : $transactionId;
    if ($orderId === '') {
        return;
    }

    $tracking = $transaction['tracking'] ?? [];
    if (!is_array($tracking)) {
        $tracking = [];
    }

    $amount = (float)($record['amount'] ?? 0);
    $priceInCents = (int)round($amount * 100);

    $payload = [
        'orderId' => $orderId,
        'platform' => 'ConnectPay',
        'paymentMethod' => 'pix',
        'status' => 'paid',
        'createdAt' => utmify_iso_to_datetime($transaction['created_at'] ?? null),
        'approvedDate' => date('Y-m-d H:i:s'),
        'refundedAt' => null,
        'customer' => [
            'name' => (string)($transaction['name'] ?? $record['name'] ?? 'Cliente Templo da Luz Amorosa'),
            'email' => (string)($transaction['email'] ?? $record['email'] ?? ''),
            'phone' => (string)($transaction['phone'] ?? $record['phone'] ?? ''),
            'document' => (string)($transaction['document'] ?? ''),
        ],
        'products' => [[
            'id' => 'tarot_amoroso_' . str_replace('.', '_', (string)$amount),
            'name' => (string)($record['package']['title'] ?? 'Leitura Amorosa'),
            'planId' => null,
            'planName' => null,
            'quantity' => 1,
            'priceInCents' => $priceInCents,
        ]],
        'trackingParameters' => [
            'src' => null,
            'sck' => $tracking['sck'] ?? null,
            'utm_source' => $tracking['utm_source'] ?? null,
            'utm_campaign' => $tracking['utm_campaign'] ?? null,
            'utm_medium' => $tracking['utm_medium'] ?? null,
            'utm_content' => $tracking['utm_content'] ?? null,
            'utm_term' => $tracking['utm_term'] ?? null,
        ],
        'commission' => [
            'totalPriceInCents' => $priceInCents,
            'gatewayFeeInCents' => 0,
            'userCommissionInCents' => $priceInCents,
        ],
        'isTest' => false,
    ];

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $url = UTMIFY_API_BASE . '/api-credentials/orders';
    $httpCode = 0;
    $response = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'x-api-token: ' . UTMIFY_API_TOKEN,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        if ($response === false) {
            utmify_log("ERRO curl ao reportar pedido {$orderId}: {$curlError}");
            return;
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "x-api-token: " . UTMIFY_API_TOKEN . "\r\nContent-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);
        $response = @file_get_contents($url, false, $context);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $httpCode = (int)$matches[1];
        }
        if ($response === false) {
            utmify_log("ERRO file_get_contents ao reportar pedido {$orderId}");
            return;
        }
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        utmify_log("FALHA ({$httpCode}) ao reportar pedido {$orderId}: {$response}");
    } else {
        utmify_log("OK ({$httpCode}) pedido {$orderId} reportado à Utmify");
    }
}

function connectpay_get_transaction(string $transactionId): ?array
{
    if ($transactionId === '') {
        return null;
    }

    $url = CONNECTPAY_API_BASE . '/v1/transactions/' . rawurlencode($transactionId);
    $response = false;
    $httpCode = 0;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'api-secret: ' . CONNECTPAY_API_SECRET,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "api-secret: " . CONNECTPAY_API_SECRET . "\r\nContent-Type: application/json\r\n",
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);
        $response = file_get_contents($url, false, $context);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $httpCode = (int)$matches[1];
        }
    }

    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $data = json_decode((string)$response, true);
    return is_array($data) ? $data : null;
}

function only_digits(string $value): string
{
    return preg_replace('/\D+/', '', $value) ?? '';
}

function make_valid_cpf(string $seed): string
{
    $digits = only_digits($seed);
    $digits = substr(str_pad($digits, 9, '7'), 0, 9);
    $base = array_map('intval', str_split($digits));

    $sum = 0;
    for ($i = 0; $i < 9; $i++) {
        $sum += $base[$i] * (10 - $i);
    }
    $d1 = 11 - ($sum % 11);
    $d1 = $d1 >= 10 ? 0 : $d1;

    $sum = 0;
    for ($i = 0; $i < 9; $i++) {
        $sum += $base[$i] * (11 - $i);
    }
    $sum += $d1 * 2;
    $d2 = 11 - ($sum % 11);
    $d2 = $d2 >= 10 ? 0 : $d2;

    return $digits . $d1 . $d2;
}

