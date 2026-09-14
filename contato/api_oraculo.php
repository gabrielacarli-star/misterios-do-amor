<?php
header('Content-Type: application/json');

$apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
if (!$apiKey) {
    $envFile = dirname(__DIR__) . '/.env';
    if (file_exists($envFile)) {
        $envLines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (is_array($envLines)) {
            foreach ($envLines as $line) {
                $line = trim($line);
                if (str_starts_with($line, 'OPENAI_API_KEY=')) {
                    $apiKey = trim(trim(substr($line, 15)), "\"'");
                    break;
                }
            }
        }
    }
}

$data = json_decode(file_get_contents('php://input'), true);
$nome = mb_convert_case(trim($data['nome'] ?? 'Cliente'), MB_CASE_TITLE, 'UTF-8');
$amor = $data['oraculo_amor'] ?? '';
$financas = $data['oraculo_financas'] ?? '';
$familia = $data['oraculo_familia'] ?? '';
$dias = (int)($data['oraculoDays'] ?? 90);
if ($dias !== 30) {
    $dias = 90;
}
$amarracao = !empty($data['hasAmarracao']);

$extra = $amarracao
    ? "Inclua ao final uma seção chamada 'Os 3 passos do amor' com: 1) limpeza do medo e da ansiedade, 2) chamada do pensamento da pessoa amada, 3) firmeza de aproximação de 3 a 7 dias. Deixe claro que é orientação espiritual, sem promessa garantida."
    : "Não mencione amarração; foque em sinais, postura e caminhos dos próximos {$dias} dias.";

$prompt = "Você é Milena Medeiros, uma taróloga e oraculista amorosa. Faça uma leitura espiritual e previsão dos próximos {$dias} dias para {$nome}. {$nome} compartilhou: medo/dor principal '{$amor}', desejo para a relação '{$financas}', e sinal que quer entender '{$familia}'. A leitura deve responder ao amor e à situação dessa pessoa. citando os pontos informados para não parecer genérica. Use tarot e oráculo amoroso, com parágrafos curtos, tom firme, místico e esperançoso. {$extra} Finalize com uma orientação prática para hoje.";

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'gpt-4o-mini',
    'messages' => [
        ['role' => 'system', 'content' => $prompt]
    ],
    'temperature' => 0.7,
    'max_tokens' => 1000
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['error' => 'Erro na API OpenAI']);
    exit;
}

$json = json_decode($response, true);
$texto = $json['choices'][0]['message']['content'] ?? '';

echo json_encode(['leitura' => $texto]);

