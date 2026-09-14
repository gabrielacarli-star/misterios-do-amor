<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método não permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'JSON inválido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = __DIR__ . '/schedules.json';
$data = ['schedules' => []];
if (file_exists($file)) {
    $raw = file_get_contents($file);
    $decoded = $raw ? json_decode($raw, true) : null;
    if (is_array($decoded)) {
        $data = $decoded;
    }
}

$sessionId = (string)($input['sessionId'] ?? ('schedule_' . date('YmdHis')));
$data['schedules'][$sessionId] = [
    'session_id' => $sessionId,
    'nome' => $input['nome'] ?? null,
    'email' => $input['email'] ?? null,
    'pessoa_amada' => $input['ente'] ?? null,
    'package_amount' => $input['packageAmount'] ?? null,
    'package_title' => $input['packageTitle'] ?? null,
    'day' => $input['day'] ?? null,
    'hour' => $input['hour'] ?? null,
    'created_at' => date('c'),
];

$fp = fopen($file, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Não foi possível salvar o agendamento.'], JSON_UNESCAPED_UNICODE);
    exit;
}

flock($fp, LOCK_EX);
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
