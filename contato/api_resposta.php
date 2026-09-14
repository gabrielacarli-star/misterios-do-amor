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
$ente = mb_convert_case(trim($data['ente'] ?? 'Pessoa Amada'), MB_CASE_TITLE, 'UTF-8');
$parentesco = $data['parentesco'] ?? 'relação amorosa';
$mensagem = $data['mensagem_upsell'] ?? '';
$situacao = $data['afastamento'] ?? '';

$prompt = "Você é Milena Medeiros, taróloga amorosa. Responda de forma curta, personalizada e direta à pergunta de {$nome} sobre {$ente}. Situação informada: '{$situacao}'. Relação atual: '{$parentesco}'. Pergunta enviada: '{$mensagem}'. Interprete como uma abertura rápida de cartas, citando sentimento, bloqueio, possível influência externa/terceira pessoa se a pergunta pedir, e uma orientação prática para as próximas 24 a 48 horas. Use tom místico, firme e humano. Não diga que é espírito, não fale de pessoa falecida, não prometa resultado garantido e não afirme traição como fato absoluto. Máximo de 2 parágrafos. Assine como Taróloga Milena.";

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
    'max_tokens' => 400
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

echo json_encode(['resposta' => $texto]);

