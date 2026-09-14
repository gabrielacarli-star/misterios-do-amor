<?php
declare(strict_types=1);

const ONLINE_SECONDS = 45;
const MAX_EVENTS = 5000;

date_default_timezone_set('America/Sao_Paulo');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$eventsFile = __DIR__ . '/events.json';
$sessionsFile = __DIR__ . '/sessions.json';

function analytics_json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function analytics_read_json(string $file, array $fallback): array
{
    if (!is_file($file)) {
        return $fallback;
    }

    $raw = file_get_contents($file);
    if ($raw === false || trim($raw) === '') {
        return $fallback;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function analytics_write_json(string $file, array $payload): void
{
    $tmp = $file . '.tmp';
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encoded === false) {
        analytics_json_out(['ok' => false, 'error' => 'Falha ao preparar os dados do analytics.'], 500);
    }

    if (file_put_contents($tmp, $encoded, LOCK_EX) === false) {
        analytics_json_out(['ok' => false, 'error' => 'Analytics sem permissão para gravar em ' . basename($file) . '.'], 500);
    }

    if (!rename($tmp, $file)) {
        @unlink($tmp);
        analytics_json_out(['ok' => false, 'error' => 'Analytics não conseguiu atualizar ' . basename($file) . '.'], 500);
    }
}

function analytics_value($value, int $max = 350): string
{
    if (!is_scalar($value)) {
        return '';
    }

    $text = trim((string) $value);
    $text = preg_replace('/\s+/', ' ', $text) ?? '';
    return substr($text, 0, $max);
}

function analytics_payload(): array
{
    $raw = file_get_contents('php://input');
    $payload = [];

    if (is_string($raw) && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    if (!$payload && $_POST) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

function analytics_ip_hash(): string
{
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? 'unknown';

    $ip = explode(',', (string) $ip)[0];
    return substr(hash('sha256', trim($ip) . '|templo-de-luz'), 0, 16);
}

function analytics_session_id(array $payload): string
{
    $sessionId = analytics_value($payload['sessionId'] ?? $payload['session_id'] ?? '', 90);
    if ($sessionId !== '') {
        return preg_replace('/[^a-zA-Z0-9._-]/', '', $sessionId) ?: $sessionId;
    }

    return 'anon_' . analytics_ip_hash();
}

function analytics_contains(string $haystack, string $needle): bool
{
    return $needle !== '' && strpos($haystack, $needle) !== false;
}

function analytics_funnel_stage(string $page, string $eventType = '', string $label = '', string $step = ''): array
{
    $parts = parse_url($page);
    $path = strtolower(is_array($parts) ? (string)($parts['path'] ?? '/') : $page);
    $query = strtolower(is_array($parts) ? (string)($parts['query'] ?? '') : '');
    $text = strtolower($page . ' ' . $eventType . ' ' . $label . ' ' . $step . ' ' . $query);

    $stages = [
        ['key' => 'home', 'name' => '1. Home / entrada'],
        ['key' => 'quiz', 'name' => '2. Quiz'],
        ['key' => 'loading', 'name' => '3. Loading'],
        ['key' => 'resultado', 'name' => '4. Resultado'],
        ['key' => 'checkout_pix', 'name' => '5. Abriu PIX'],
        ['key' => 'obrigado', 'name' => '6. Obrigado / pago'],
        ['key' => 'contato', 'name' => '7. Atendimento / contato'],
    ];

    $pick = function (int $index) use ($stages): array {
        return ['index' => $index + 1, 'key' => $stages[$index]['key'], 'name' => $stages[$index]['name']];
    };

    if (analytics_contains($text, 'confirmar pix') || analytics_contains($text, 'copiar código pix') || analytics_contains($text, 'copiar codigo pix') || analytics_contains($text, 'pix gerado') || analytics_contains($text, 'create-pix')) {
        return $pick(4);
    }
    if (analytics_contains($path, 'obrigado') || analytics_contains($text, 'pagamento confirmado')) {
        return $pick(5);
    }
    if (analytics_contains($path, 'contato') || analytics_contains($text, 'chat entregavel')) {
        return $pick(6);
    }
    if (analytics_contains($path, 'resultado') || analytics_contains($query, 'step=result') || analytics_contains($text, 'gerar chave pix') || analytics_contains($text, 'consagrar vela')) {
        return $pick(3);
    }
    if (analytics_contains($query, 'step=loading') || analytics_contains($text, 'preparando')) {
        return $pick(2);
    }
    if (analytics_contains($query, 'step=ente') || analytics_contains($query, 'step=relacao') || analytics_contains($query, 'step=tempo') || analytics_contains($query, 'step=mensagem') || analytics_contains($query, 'step=confirma') || analytics_contains($text, 'prosseguir com amor')) {
        return $pick(1);
    }
    if ($path === '/' || $path === '' || analytics_contains($query, 'step=intro') || analytics_contains($text, 'revelar minha carta') || analytics_contains($text, 'iniciar leitura de tarot')) {
        return $pick(0);
    }

    return ['index' => 0, 'key' => 'outros', 'name' => 'Outros'];
}

function analytics_page_label(string $page): string
{
    $path = $page;
    $parts = parse_url($page);
    if (is_array($parts)) {
        $path = ($parts['path'] ?? '/') . (isset($parts['query']) ? '?' . $parts['query'] : '');
    }

    if ($path === '/' || analytics_contains($path, 'step=intro')) return 'Home';
    if (analytics_contains($path, 'step=ente')) return 'Quiz - nome do ente';
    if (analytics_contains($path, 'step=relacao')) return 'Quiz - vínculo';
    if (analytics_contains($path, 'step=tempo')) return 'Quiz - tempo';
    if (analytics_contains($path, 'step=mensagem')) return 'Quiz - mensagem';
    if (analytics_contains($path, 'step=confirma')) return 'Quiz - confirmação';
    if (analytics_contains($path, 'step=loading')) return 'Loading';
    if (analytics_contains($path, 'resultado')) return 'Resultado';
    if (analytics_contains($path, 'escrever-carta')) return 'Escrever carta';
    if (analytics_contains($path, 'chamada-ao-vivo')) return 'Chamada ao vivo';
    if (analytics_contains($path, 'obrigado')) return 'Obrigado';
    if (analytics_contains($path, 'contato')) return 'Contato';
    return $path ?: 'Página desconhecida';
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    analytics_json_out(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $now = time();
    $sessions = analytics_read_json($sessionsFile, []);
    $events = analytics_read_json($eventsFile, []);

    $online = [];
    foreach ($sessions as $session) {
        if (($session['last_seen'] ?? 0) >= ($now - ONLINE_SECONDS)) {
            $online[] = $session;
        }
    }

    usort($online, function ($a, $b) {
        return ($b['last_seen'] ?? 0) <=> ($a['last_seen'] ?? 0);
    });

    $todayStart = strtotime(date('Y-m-d 00:00:00'));
    $todayEvents = array_values(array_filter($events, function ($event) use ($todayStart) {
        return ($event['created_at'] ?? 0) >= $todayStart;
    }));
    $uniqueToday = [];
    foreach ($todayEvents as $event) {
        $uniqueToday[$event['session_id'] ?? ''] = true;
    }

    $stageTemplate = [
        'home' => ['index' => 1, 'name' => '1. Home / entrada', 'sessions' => [], 'events' => 0],
        'quiz' => ['index' => 2, 'name' => '2. Quiz', 'sessions' => [], 'events' => 0],
        'loading' => ['index' => 3, 'name' => '3. Loading', 'sessions' => [], 'events' => 0],
        'resultado' => ['index' => 4, 'name' => '4. Resultado', 'sessions' => [], 'events' => 0],
        'checkout_pix' => ['index' => 5, 'name' => '5. Abriu PIX', 'sessions' => [], 'events' => 0],
        'obrigado' => ['index' => 6, 'name' => '6. Obrigado / pago', 'sessions' => [], 'events' => 0],
        'contato' => ['index' => 7, 'name' => '7. Atendimento / contato', 'sessions' => [], 'events' => 0],
    ];
    $pages = [];
    $clicks = [];
    foreach ($todayEvents as $event) {
        $stage = analytics_funnel_stage((string)($event['page'] ?? ''), (string)($event['event_type'] ?? ''), (string)($event['label'] ?? ''), (string)($event['step'] ?? ''));
        if (isset($stageTemplate[$stage['key']])) {
            $stageTemplate[$stage['key']]['events']++;
            $stageTemplate[$stage['key']]['sessions'][$event['session_id'] ?? ''] = true;
        }

        if (($event['event_type'] ?? '') === 'pageview') {
            $pageLabel = analytics_page_label((string)($event['page'] ?? ''));
            $pages[$pageLabel] = ($pages[$pageLabel] ?? 0) + 1;
        }

        if (($event['event_type'] ?? '') === 'click') {
            $label = analytics_value($event['label'] ?? 'Clique sem nome', 100);
            if ($label !== '') {
                $clicks[$label] = ($clicks[$label] ?? 0) + 1;
            }
        }
    }

    $funnel = [];
    $previous = null;
    foreach ($stageTemplate as $key => $stage) {
        $visitors = count(array_filter(array_keys($stage['sessions'])));
        $drop = $previous !== null ? max(0, $previous - $visitors) : 0;
        $dropRate = $previous && $previous > 0 ? round(($drop / $previous) * 100, 1) : 0;
        $funnel[] = [
            'key' => $key,
            'index' => $stage['index'],
            'name' => $stage['name'],
            'visitors' => $visitors,
            'events' => $stage['events'],
            'drop_from_previous' => $drop,
            'drop_rate' => $dropRate,
        ];
        $previous = $visitors;
    }

    arsort($pages);
    arsort($clicks);

    analytics_json_out([
        'ok' => true,
        'server_time' => $now,
        'online_seconds' => ONLINE_SECONDS,
        'online' => $online,
        'summary' => [
            'online_now' => count($online),
            'visitors_today' => max(0, count($uniqueToday) - (isset($uniqueToday['']) ? 1 : 0)),
            'events_today' => count($todayEvents),
            'total_sessions' => count($sessions),
        ],
        'funnel' => $funnel,
        'top_pages' => array_slice($pages, 0, 12, true),
        'top_clicks' => array_slice($clicks, 0, 12, true),
        'recent_events' => array_slice(array_reverse($events), 0, 80),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    analytics_json_out(['ok' => false, 'error' => 'Método não permitido.'], 405);
}

$payload = analytics_payload();
$now = time();
$sessionId = analytics_session_id($payload);
$page = analytics_value($payload['page'] ?? $_SERVER['HTTP_REFERER'] ?? '', 500);
$title = analytics_value($payload['title'] ?? '', 160);
$eventType = analytics_value($payload['eventType'] ?? $payload['event_type'] ?? $payload['type'] ?? 'pageview', 80);
$step = analytics_value($payload['step'] ?? '', 120);
$chatName = analytics_value($payload['chatName'] ?? $payload['chat_name'] ?? '', 160);
$label = analytics_value($payload['label'] ?? '', 180);
$stage = analytics_funnel_stage($page, $eventType, $label, $step);

$sessions = analytics_read_json($sessionsFile, []);
$sessions[$sessionId] = [
    'session_id' => $sessionId,
    'last_seen' => $now,
    'first_seen' => $sessions[$sessionId]['first_seen'] ?? $now,
    'page' => $page,
    'title' => $title,
    'event_type' => $eventType,
    'step' => $step,
    'chat_name' => $chatName,
    'funnel_stage' => $stage['name'],
    'funnel_stage_key' => $stage['key'],
    'funnel_stage_index' => $stage['index'],
    'referrer' => analytics_value($payload['referrer'] ?? '', 500),
    'utm_source' => analytics_value($payload['utm_source'] ?? '', 120),
    'utm_medium' => analytics_value($payload['utm_medium'] ?? '', 120),
    'utm_campaign' => analytics_value($payload['utm_campaign'] ?? '', 160),
    'ip_hash' => analytics_ip_hash(),
    'user_agent' => analytics_value($_SERVER['HTTP_USER_AGENT'] ?? '', 220),
];

foreach ($sessions as $id => $session) {
    if (($session['last_seen'] ?? 0) < ($now - 86400)) {
        unset($sessions[$id]);
    }
}

$events = analytics_read_json($eventsFile, []);
$events[] = [
    'created_at' => $now,
    'session_id' => $sessionId,
    'event_type' => $eventType,
    'step' => $step,
    'chat_name' => $chatName,
    'page' => $page,
    'title' => $title,
    'label' => $label,
    'value' => analytics_value($payload['value'] ?? '', 180),
    'funnel_stage' => $stage['name'],
    'funnel_stage_key' => $stage['key'],
    'funnel_stage_index' => $stage['index'],
    'utm_source' => analytics_value($payload['utm_source'] ?? '', 120),
    'utm_medium' => analytics_value($payload['utm_medium'] ?? '', 120),
    'utm_campaign' => analytics_value($payload['utm_campaign'] ?? '', 160),
    'ip_hash' => analytics_ip_hash(),
];

if (count($events) > MAX_EVENTS) {
    $events = array_slice($events, -MAX_EVENTS);
}

analytics_write_json($sessionsFile, $sessions);
analytics_write_json($eventsFile, $events);

analytics_json_out(['ok' => true, 'online_seconds' => ONLINE_SECONDS]);
