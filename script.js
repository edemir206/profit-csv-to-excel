 // Transforme o elemento select em um Select2
 $(document).ready(function() {
    $('#selectedFields').select2();
});

let result = [];

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
        const qtdExecutada = parseInt(columns[13]);

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
    // console.log(currentOrder);
    const selectedFields = currentOrder.length > 0 ? currentOrder : getSelectedFields();
    if (i > 0 && i < selectedFields.length) {
        const temp = selectedFields[i];
        selectedFields[i] = selectedFields[i - 1];
        selectedFields[i - 1] = temp;
        currentOrder = selectedFields; // Atualizar a ordem atual das colunas

        console.log("Tempo :"+temp+" selectedFields[i] "+selectedFields[i]+ " selectedFields[i - 1] +"+temp);
        console.log(currentOrder);

        const table = createTable(result, selectedFields);
        document.getElementById('resultTable').innerHTML = table;
    }
}

function createTable(data, selectedFields) {

     // Use o array currentOrder para determinar a ordem das colunas na tabela
     selectedFields = currentOrder.length > 0 ? currentOrder : selectedFields;

    //  console.log(currentOrder);

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
        const precoMedio = (precoTotal / qtdTotal).toFixed(2).replace('.', ','); // Substituir ponto por vírgula

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
                tableHTML += `<td>${precoMedio}</td>`;
            } else if (field === 'Qtd Executada') {
                tableHTML += `<td>${qtdTotal}</td>`;
            }
        }
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table></div>';
    return tableHTML;
}