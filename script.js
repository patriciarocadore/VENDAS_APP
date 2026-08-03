// =====================================================
// SCRIPT.JS – INTEGRAÇÃO COM API + UI
// =====================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwxSuwh7_bROneK8DLSc0c5vE94CtZXfnoUf6PdMapyMRLoUh47JUlSMpwAUT_fASLg/exec';

// ===== ELEMENTOS DOM =====
const tbProdutos = document.getElementById('tbProdutos');
const totalVendidoEl = document.getElementById('totalVendido');
const qtdeVendasEl = document.getElementById('qtdeVendas');
const ticketMedioEl = document.getElementById('ticketMedio');

// ===== FUNÇÕES API =====
async function apiGet(action) {
    const resp = await fetch(`${API_URL}?action=${action}`);
    return await resp.json();
}

async function apiPost(action, data) {
    const resp = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await resp.json();
}

async function carregarProdutos() {
    const result = await apiGet('produtos');
    return result.success ? result.data : [];
}

async function carregarClientes() {
    const result = await apiGet('clientes');
    return result.success ? result.data : [];
}

async function carregarVendas() {
    const result = await apiGet('vendas');
    return result.success ? result.data : [];
}

async function carregarResumo() {
    const result = await apiGet('resumo');
    if (result.success) return result.data;
    return { totalVendido: 0, qtdeVendas: 0, ticketMedio: 0 };
}

async function salvarProduto(produto) {
    return await apiPost('salvarProduto', produto);
}

async function registrarVenda(venda) {
    return await apiPost('registrarVenda', venda);
}

// ===== UI FUNCTIONS =====
async function atualizarCards() {
    const resumo = await carregarResumo();
    totalVendidoEl.textContent = `R$ ${resumo.totalVendido.toFixed(2)}`;
    qtdeVendasEl.textContent = resumo.qtdeVendas;
    ticketMedioEl.textContent = `R$ ${resumo.ticketMedio.toFixed(2)}`;
}

async function carregarTabelaProdutos() {
    const produtos = await carregarProdutos();
    tbProdutos.innerHTML = '';
    if (produtos.length === 0) {
        tbProdutos.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:24px; color:#64748b;">Nenhum produto</td></tr>';
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
                label: 'Total (R$)',
                data: dados,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderColor: '#4f46e5',
                borderWidth: 2,
                borderRadius: 6,
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
                        color: '#94a3b8',
                        callback: value => 'R$ ' + value.toFixed(2)
                    }
                },
                x: {
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// ===== MODAIS (simples com prompt) =====
window.abrirModalVenda = async function() {
    const clientes = await carregarClientes();
    if (clientes.length === 0) {
        alert('Cadastre clientes primeiro.');
        return;
    }
    const cliente = prompt('Código do cliente (ex: CLT-001):');
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
        await atualizarCards();
        await carregarTabelaProdutos();
        // recarregar gráfico (limpa e recria)
        document.getElementById('graficoVendas').replaceWith(document.getElementById('graficoVendas').cloneNode());
        await carregarGrafico();
    } else {
        alert('Erro: ' + result.message);
    }
};

// ===== MENU =====
function configurarMenu() {
    const items = document.querySelectorAll('.sidebar li');
    items.forEach(item => {
        item.addEventListener('click', function() {
            items.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const action = this.dataset.action;
            switch (action) {
                case 'dashboard':
                    atualizarCards();
                    carregarTabelaProdutos();
                    document.getElementById('graficoVendas').replaceWith(document.getElementById('graficoVendas').cloneNode());
                    carregarGrafico();
                    break;
                case 'produtos':
                    // abre cadastro de produto (simples)
                    const codigo = prompt('Código (deixe em branco para novo):');
                    const descricao = prompt('Descrição:');
                    const valor = prompt('Valor:');
                    if (descricao && valor) {
                        salvarProduto({ codigo: codigo || '', descricao, valor: parseFloat(valor) })
                            .then(res => {
                                alert(res.data.mensagem || 'Salvo!');
                                carregarTabelaProdutos();
                            });
                    }
                    break;
                case 'novaVenda':
                    abrirModalVenda();
                    break;
                case 'clientes':
                    alert('Em breve: gestão de clientes.');
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

// ===== DATA ATUAL =====
function atualizarData() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    document.getElementById('dataAtual').textContent = now.toLocaleDateString('pt-BR', options);
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    atualizarData();
    await Promise.all([
        atualizarCards(),
        carregarTabelaProdutos(),
        carregarGrafico()
    ]);
    configurarMenu();
});
