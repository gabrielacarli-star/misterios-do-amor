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
$parentesco = mb_strtolower(trim($data['parentesco'] ?? 'relação amorosa'), 'UTF-8');
$mensagem = $data['mensagem'] ?? 'Nenhuma mensagem específica';

$prompt = "Você é Milena Medeiros, taróloga espiritualista especializada em amor, reconciliação, terceira pessoa e amarração do amor. Faça uma leitura íntima e personalizada para {$nome} sobre {$ente}. A situação informada foi '{$parentesco}' e a mensagem principal foi: '{$mensagem}'. Responda diretamente ao que {$nome} escreveu, citando o contexto da dúvida para não parecer genérico. Use linguagem de tarot com cartas como A Lua, Os Enamorados, A Sacerdotisa, O Diabo e A Temperança quando fizer sentido. Estruture em parágrafos curtos: sentimento atual, bloqueio oculto, possível terceira pessoa ou influência externa, caminho de aproximação/amarração do amor e orientação prática para as próximas 48 horas. Seja firme, envolvente e clara, mas não prometa resultado garantido e não afirme traição como fato absoluto sem tratar como sinal das cartas. Não use emojis, colchetes, cabeçalhos exagerados nem linguagem de carta psicografada ou pessoa falecida. Finalize como Taróloga Milena.";

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
    echo json_encode(['error' => 'Erro na API OpenAI', 'details' => $response]);
    exit;
}

$json = json_decode($response, true);
$texto = $json['choices'][0]['message']['content'] ?? '';

// Retorna o texto puro gerado pela IA
echo json_encode(['carta' => $texto]);


