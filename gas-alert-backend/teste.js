import fetch from "node-fetch";

const resposta = await fetch("http://10.0.2.95:3000/alert", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    sensorOwner: "Cozinha",
    gasLevel: 50
  })
});

const data = await resposta.json();
console.log("✅ Resposta do servidor:", data);
if (resposta.ok) {
  console.log("Alerta enviado com sucesso!");
}