const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve o front-end

// Salva alertas no db.json
app.post('/api/alerta', (req, res) => {
  const { local, nivelGas } = req.body;
  const alerta = {
    local,
    nivelGas,
    dataHora: new Date().toLocaleString()
  };

  // Salva no arquivo db.json
  const data = fs.existsSync('db.json') ? JSON.parse(fs.readFileSync('db.json')) : [];
  data.push(alerta);
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));

  console.log('🚨 Alerta recebido:', alerta);
  res.status(200).json({ status: 'Alerta salvo com sucesso!' });
});

// Lista os alertas salvos
app.get('/api/alertas', (req, res) => {
  const data = fs.existsSync('db.json') ? JSON.parse(fs.readFileSync('db.json')) : [];
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
