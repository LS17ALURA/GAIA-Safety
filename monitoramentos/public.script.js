async function carregarAlertas() {
  const res = await fetch('/api/alertas');
  const alertas = await res.json();

  const tabela = document.getElementById('alertas');
  tabela.innerHTML = '';

  alertas.reverse().forEach(alerta => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${alerta.local}</td>
      <td>${alerta.nivelGas}</td>
      <td>${alerta.dataHora}</td>
    `;
    tabela.appendChild(row);
  });
}

setInterval(carregarAlertas, 3000); // Atualiza a cada 3 segundos
carregarAlertas();
