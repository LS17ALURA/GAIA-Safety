import fetch from 'node-fetch';

// Pega argumentos da linha de comando: node test-alert.js <sensorOwner> <gasLevel>
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Uso: node test-alert.js <sensorOwner> <gasLevel>');
  process.exit(1);
}

const [sensorOwner, gasLevelStr] = args;
const gasLevel = Number(gasLevelStr);

if (isNaN(gasLevel)) {
  console.error('O gasLevel deve ser um número');
  process.exit(1);
}

const payload = {
  sensorOwner,
  gasLevel
};

fetch('http://localhost:3000/alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Resposta da API:', data);
  })
  .catch(err => {
    console.error('❌ Erro ao enviar alerta:', err);
  });
