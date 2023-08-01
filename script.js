 // Transforme o elemento select em um Select2
 $(document).ready(function() {
    $('#selectedFields').select2();
});

let result = [];
const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function processCSV() {
const csvDataInput = document.getElementById('csvData');
const csvFileInput = document.getElementById('csvFile');

if (csvFileInput.files.length > 0) {
    const file = csvFileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const fileData = e.target.result;
        processData(fileData);
    }

    reader.readAsText(file);
} else {
    const csvData = csvDataInput.value;
    processData(csvData);
}
}

function processData(csvData) {
const lines = csvData.trim().split('\n').slice(2); // Ignore a primeira linha

    const groupedByDate = {};

    lines.forEach(line => {
        const columns = line.split(';');
        const ativo = columns[4];
        const lado = columns[5];
        const data = columns[7].split(' ')[0]; // Pegar apenas a parte da data, removendo a hora e o minuto
        const ultimaAtualizacao = columns[8].split(' ')[0]; // Pegar apenas a parte da data, removendo a hora e o minuto
        const precoMedio = parseFloat(columns[12].replace(',', '.'));
        const qtdExecutada = parseInt(columns[13].replace('.', ''));

        const key = `${data}_${ativo}_${lado}`;

        if (!groupedByDate[key]) {
            groupedByDate[key] = {
                ativo, // Correção: Adicionar o ativo ao objeto
                lado,
                data,
                ultimaAtualizacao,
                precoTotal: precoMedio * qtdExecutada,
                qtdTotal: qtdExecutada
            };
        } else {
            groupedByDate[key].precoTotal += precoMedio * qtdExecutada;
            groupedByDate[key].qtdTotal += qtdExecutada;
        }
    });

    result = Object.values(groupedByDate);

    // Ordenar os dados pelo campo 'data' em ordem crescente
    result.sort((a, b) => (a.data > b.data ? 1 : -1));

    const selectedFields = getSelectedFields();
    const table = createTable(result, selectedFields);
    document.getElementById('resultTable').innerHTML = table;

    document.getElementById('myTab').classList.remove('d-none');

    generateSummaryTable(result);

}

function getSelectedFields() {
    const select = document.getElementById('selectedFields');
    const selectedFields = [];

    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
            selectedFields.push(select.options[i].value);
        }
    }

    return selectedFields;
}

// Adicione uma variável global para armazenar a ordem atual das colunas
let currentOrder = [];

function reorder(i) {
    const selectedFields = currentOrder.length > 0 ? currentOrder : getSelectedFields();
    if (i > 0 && i < selectedFields.length) {
        const temp = selectedFields[i];
        selectedFields[i] = selectedFields[i - 1];
        selectedFields[i - 1] = temp;
        currentOrder = selectedFields; // Atualizar a ordem atual das colunas

        const table = createTable(result, selectedFields);
        document.getElementById('resultTable').innerHTML = table;
    }
}

function createTable(data, selectedFields) {

     // Use o array currentOrder para determinar a ordem das colunas na tabela
     selectedFields = currentOrder.length > 0 ? currentOrder : selectedFields;

    let tableHTML = '<div class="table-responsive">';
    tableHTML += '<table class="table table-striped table-bordered table-hover">'; // Adicionando classes do Bootstrap
    tableHTML += '<thead class="table-primary"><tr>';

    let i = 0;

    for (const field of selectedFields) {
        tableHTML += `<th>`;
        if(i != 0) tableHTML += `<button onclick="reorder(${i})" class="btn btn-sm btn-secondary"> < </button>`;
            tableHTML += " "+field+" ";
        if(i+1 < selectedFields.length) tableHTML += `<button onclick="reorder(${i+1})" class="btn btn-sm btn-secondary"> > </button>`;
        
        i++;
    }

    tableHTML += '</tr></thead><tbody>';

    for (const item of data) {
        const { data: itemData, ativo, lado, ultimaAtualizacao, precoTotal, qtdTotal } = item;
        const precoMedio = (precoTotal / qtdTotal); // Substituir ponto por vírgula

        tableHTML += '<tr>';
        for (const field of selectedFields) {
            if (field === 'Ativo') {
                tableHTML += `<td>${ativo}</td>`;
            } else if (field === 'Lado') {
                tableHTML += `<td>${lado}</td>`;
            } else if (field === 'Data') {
                tableHTML += `<td>${itemData}</td>`;
            } else if (field === 'Última Atualização') {
                tableHTML += `<td>${ultimaAtualizacao}</td>`;
            } else if (field === 'Preço Médio') {
                tableHTML += `<td>${formatter.format(precoMedio)}</td>`;
            } else if (field === 'Qtd Executada') {
                tableHTML += `<td>${qtdTotal}</td>`;
            }
        }
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table></div>';
    return tableHTML;
}

function generateSummaryTable(data) {
    const summaryData = {};

    // Calcula o resumo das movimentações agrupadas por ativo
    data.forEach(item => {
        const { ativo, lado, precoTotal, qtdTotal } = item;
        const lucro = lado === 'C' ? precoTotal : -precoTotal;
        const qtdTotalResumo=0;

        if (!summaryData[ativo]) {
            summaryData[ativo] = {
                ativo,
                totalCompra: lado === 'C' ? precoTotal : 0,
                totalVenda: lado === 'V' ? precoTotal : 0,
                qtdTotalResumo: lado === 'C' ? qtdTotalResumo+qtdTotal : qtdTotalResumo-qtdTotal,
                lucro
            };
        } else {
            summaryData[ativo].totalCompra += lado === 'C' ? precoTotal : 0;
            summaryData[ativo].totalVenda += lado === 'V' ? precoTotal : 0;
            summaryData[ativo].lucro += lucro;
        }
    });

    // Calcula o resultado em porcentagem
    Object.values(summaryData).forEach(item => {
        item.lucroPorcentagem = ((item.lucro / (item.totalCompra + item.totalVenda)) * 100).toFixed(2);
    });

    // Ordena os dados pelo campo 'ativo' em ordem alfabética
    const summaryTableData = Object.values(summaryData).sort((a, b) => (a.ativo > b.ativo ? 1 : -1));

    // Cria a tabela de resumo
    let summaryTableHTML = '<div class="table-responsive">';
    summaryTableHTML += '<table class="table table-striped table-bordered table-hover">'; // Adicionando classes do Bootstrap
    summaryTableHTML += '<thead class="table-primary"><tr>';
    summaryTableHTML += '<th>Ativo</th>';
    summaryTableHTML += '<th>Cotas</th>';
    summaryTableHTML += '<th>Total Compra</th>';
    summaryTableHTML += '<th>Total Venda</th>';
    summaryTableHTML += '<th>Resultado</th>';
    summaryTableHTML += '<th>Resultado em porcentagem</th>';
    summaryTableHTML += '</tr></thead><tbody>';

    // Adiciona os dados na tabela de resumo
    summaryTableData.forEach(item => {
        summaryTableHTML += '<tr>';
        summaryTableHTML += `<td>${item.ativo}</td>`;
        summaryTableHTML += `<td>${item.qtdTotalResumo}</td>`;
        summaryTableHTML += `<td>${formatter.format(item.totalCompra)}</td>`;
        summaryTableHTML += `<td>${formatter.format(item.totalVenda)}</td>`;
        summaryTableHTML += `<td>${formatter.format(item.lucro)}</td>`;
        summaryTableHTML += `<td>${item.lucroPorcentagem.replace('.', ',')}%</td>`;
        summaryTableHTML += '</tr>';
    });

    summaryTableHTML += '</tbody></table></div>';

    // Exibe a tabela de resumo
    document.getElementById('summaryTable').innerHTML = summaryTableHTML;

     // Exibe as informações de somatório total em uma pequena tabela
     const totalCompra = summaryTableData.reduce((total, item) => total + item.totalCompra, 0);
     const totalVenda = summaryTableData.reduce((total, item) => total + item.totalVenda, 0);
     const lucroTotal = summaryTableData.reduce((total, item) => total + item.lucro, 0);
     const lucroPorcentagemTotal = ((lucroTotal / (totalCompra + totalVenda)) * 100).toFixed(2);
 
     const totalInfoHTML = `<div class="table-responsive">
                               <table class="table">
                                 <tbody>
                                   <tr>
                                     <th>Total Compra</th>
                                     <td>${formatter.format(totalCompra)}</td>
                                   </tr>
                                   <tr>
                                     <th>Total Venda</th>
                                     <td>${formatter.format(totalVenda)}</td>
                                   </tr>
                                   <tr>
                                     <th>Resultado</th>
                                     <td>${formatter.format(lucroTotal)}</td>
                                   </tr>
                                   <tr>
                                     <th>Resultado em porcentagem</th>
                                     <td>${lucroPorcentagemTotal.replace('.', ',')}%</td>
                                   </tr>
                                 </tbody>
                               </table>
                             </div>`;
     document.getElementById('summaryTotal').innerHTML = totalInfoHTML;
}