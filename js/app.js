// =====================================================
// APP PRINCIPAL
// =====================================================

// Elementos
const tbProdutos = document.getElementById('tbProdutos');
const totalVendidoEl = document.getElementById('totalVendido');
const qtdeVendasEl = document.getElementById('qtdeVendas');
const ticketMedioEl = document.getElementById('ticketMedio');

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
  await atualizarDashboard();
});

// --- Atualiza todos os dados ---
async function atualizarDashboard() {
  await Promise.all([
    carregarTabelaProdutos(),
    atualizarCards()
  ]);
}

// --- Tabela Produtos ---
async function carregarTabelaProdutos() {
  const produtos = await carregarProdutos();
  tbProdutos.innerHTML = '';
  if (produtos.length === 0) {
    tbProdutos.innerHTML = '<tr><td colspan="3">Nenhum produto cadastrado</td></tr>';
    return;
  }
  produtos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.descricao}</td>
      <td>R$ ${Number(p.valor).toFixed(2)}</td>
    `;
    tbProdutos.appendChild(tr);
  });
}

// --- Cards ---
async function atualizarCards() {
  const resumo = await carregarResumo();
  totalVendidoEl.textContent = `R$ ${resumo.totalVendido.toFixed(2)}`;
  qtdeVendasEl.textContent = resumo.qtdeVendas;
  ticketMedioEl.textContent = `R$ ${resumo.ticketMedio.toFixed(2)}`;
}

// --- Botão "Atualizar" (já existe no HTML) ---
window.carregarProdutos = carregarTabelaProdutos; // para o onclick do botão

// =====================================================
// EXEMPLOS DE FUNÇÕES PARA MODAIS (adicione conforme necessidade)
// =====================================================

/**
 * Abre modal para cadastrar novo produto.
 * Você pode implementar um modal simples com prompt ou criar um formulário.
 */
function abrirModalProduto() {
  const codigo = prompt('Código do produto (deixe em branco para novo):');
  const descricao = prompt('Descrição:');
  const valor = prompt('Valor (ex: 19.90):');
  if (descricao && valor) {
    salvarProduto({ codigo: codigo || '', descricao, valor: parseFloat(valor) })
      .then(result => {
        alert(result.data.mensagem || 'Produto salvo');
        carregarTabelaProdutos();
      })
      .catch(err => alert('Erro: ' + err));
  }
}

/**
 * Exemplo para nova venda (simplificado com prompts).
 * Idealmente, crie um modal com selects de cliente e produtos.
 */
async function abrirModalVenda() {
  const clientes = await carregarClientes();
  if (clientes.length === 0) {
    alert('Cadastre clientes primeiro.');
    return;
  }
  const cliente = prompt('Digite o código do cliente (ex: CLT-001):');
  if (!cliente) return;

  // Aqui você pode fazer um loop para adicionar vários itens
  const itens = [];
  let continuar = true;
  while (continuar) {
    const codProd = prompt('Código do produto (ou cancelar para finalizar):');
    if (!codProd) break;
    const qtd = parseInt(prompt('Quantidade:'), 10);
    if (isNaN(qtd) || qtd <= 0) {
      alert('Quantidade inválida.');
      continue;
    }
    itens.push({ codigoProduto: codProd, quantidade: qtd });
    continuar = confirm('Adicionar mais um item?');
  }

  if (itens.length === 0) {
    alert('Venda sem itens.');
    return;
  }

  const venda = { cliente, itens };
  const result = await registrarVenda(venda);
  if (result.success) {
    alert(`Venda registrada! Total: R$ ${result.data.total.toFixed(2)}`);
    await atualizarDashboard();
  } else {
    alert('Erro: ' + result.message);
  }
}

// Vincular funções aos itens do menu (sidebar) – você pode adicionar onclick nos <li>
document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.sidebar li');
  // Exemplo: o segundo item é "Produtos", terceiro "Clientes", quarto "Nova Venda"
  if (menuItems.length >= 4) {
    menuItems[1].addEventListener('click', abrirModalProduto); // Produtos -> cadastrar
    menuItems[3].addEventListener('click', abrirModalVenda);   // Nova Venda
  }
});
