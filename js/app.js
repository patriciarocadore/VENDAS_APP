// =====================================================
// APP.JS - Lógica da interface e manipulação do DOM
// =====================================================

const tbProdutos = document.getElementById('tbProdutos');
const totalVendidoEl = document.getElementById('totalVendido');
const qtdeVendasEl = document.getElementById('qtdeVendas');
const ticketMedioEl = document.getElementById('ticketMedio');

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarDashboard();
    await carregarGrafico();
    configurarMenu();
});

// --- Atualiza tudo ---
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
        tbProdutos.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:30px;">Nenhum produto cadastrado</td></tr>';
        return;
    }
    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.codigo}</strong></td>
            <td>${p.descricao}</td>
            <td>R$ ${Number(p.valor).toFixed(2)}</td>
        `;
        tbProdutos.appendChild(tr);
    });
}

// --- Cards de resumo ---
async function atualizarCards() {
    const resumo = await carregarResumo();
    totalVendidoEl.textContent = `R$ ${resumo.totalVendido.toFixed(2)}`;
    qtdeVendasEl.textContent = resumo.qtdeVendas;
    ticketMedioEl.textContent = `R$ ${resumo.ticketMedio.toFixed(2)}`;
}

// --- Gráfico ---
async function carregarGrafico() {
    const vendas = await carregarVendas();
    const meses = {};
    vendas.forEach(v => {
        if (v.data) {
            const mes = v.data.substring(0, 7);
            meses[mes] = (meses[mes] || 0) + v.total;
        }
    });
    const labels = Object.keys(meses).sort();
    const dados = labels.map(m => meses[m]);

    const ctx = document.getElementById('graficoVendas').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Vendido (R$)',
                data: dados,
                backgroundColor: '#3b82f6',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => 'R$ ' + value.toFixed(2)
                    }
                }
            }
        }
    });
}

// ===== FUNÇÕES DOS BOTÕES =====
window.abrirModalProduto = function() {
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
};

window.abrirModalVenda = async function() {
    const clientes = await carregarClientes();
    if (clientes.length === 0) {
        alert('Cadastre clientes primeiro.');
        return;
    }
    const cliente = prompt('Digite o código do cliente (ex: CLT-001):');
    if (!cliente) return;

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
        await carregarGrafico();
    } else {
        alert('Erro: ' + result.message);
    }
};

function configurarMenu() {
    const menuItems = document.querySelectorAll('.sidebar li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(li => li.classList.remove('active'));
            this.classList.add('active');

            const action = this.dataset.action;
            switch (action) {
                case 'produtos':
                    abrirModalProduto();
                    break;
                case 'novaVenda':
                    abrirModalVenda();
                    break;
                case 'dashboard':
                    atualizarDashboard();
                    carregarGrafico();
                    break;
                case 'clientes':
                    alert('Funcionalidade de clientes em breve.');
                    break;
                case 'relatorios':
                    alert('Relatórios em desenvolvimento.');
                    break;
                default:
                    break;
            }
        });
    });
}
