// URL do seu Web App (substitua pela sua)
const API_URL = 'https://script.google.com/macros/s/SEU_ID/exec';

// Função auxiliar para chamar GET
async function apiGet(action) {
  const url = `${API_URL}?action=${action}`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json;
}

// Função auxiliar para chamar POST
async function apiPost(action, data) {
  const url = `${API_URL}?action=${action}`;
  const resp = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await resp.json();
  return json;
}

// --- Funções específicas ---

async function carregarProdutos() {
  const result = await apiGet('produtos');
  if (result.success) {
    return result.data;
  } else {
    alert('Erro ao carregar produtos: ' + result.message);
    return [];
  }
}

async function carregarClientes() {
  const result = await apiGet('clientes');
  if (result.success) {
    return result.data;
  } else {
    alert('Erro ao carregar clientes: ' + result.message);
    return [];
  }
}

async function carregarResumo() {
  const result = await apiGet('resumo');
  if (result.success) {
    return result.data;
  } else {
    console.error('Erro no resumo:', result.message);
    return { totalVendido: 0, qtdeVendas: 0, ticketMedio: 0 };
  }
}

async function salvarProduto(produto) {
  const result = await apiPost('salvarProduto', produto);
  return result;
}

async function salvarCliente(cliente) {
  const result = await apiPost('salvarCliente', cliente);
  return result;
}

async function registrarVenda(venda) {
  const result = await apiPost('registrarVenda', venda);
  return result;
}
