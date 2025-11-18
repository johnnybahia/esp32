// ==============================================================
// ROTEADOR PRINCIPAL (Decide se salva dados ou mostra o painel)
// ==============================================================
function doGet(e) {
  // Se o ESP32 mandou dados (tem parametros), salva na planilha
  if (e.parameter && e.parameter.maquina) {
    return salvarDadosESP32(e);
  }
  // Se for você acessando pelo navegador, mostra o Painel Visual
  return HtmlService.createHtmlOutputFromFile('Painel')
      .setTitle('Monitoramento Máquinas')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==============================================================
// FUNÇÃO 1: SALVAR DADOS (O que o ESP32 usa)
// ==============================================================
function salvarDadosESP32(e) {
  var maquina = e.parameter.maquina;
  var evento = e.parameter.evento;
  var duracao = e.parameter.duracao;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); // Pega a aba ativa
  var dataAtual = new Date();
  
  sheet.appendRow([dataAtual, dataAtual, maquina, evento, duracao]);
  
  // Formatação visual (Data e Hora)
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(lastRow, 2).setNumberFormat("HH:mm:ss");
  
  return ContentService.createTextOutput("Recebido com sucesso!");
}

// ==============================================================
// FUNÇÃO 2: LER DADOS (O que o Painel Visual usa)
// ==============================================================
function buscarUltimosEstados() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // Se a planilha estiver vazia, retorna vazio para não dar erro
  if (lastRow < 2) return {}; 
  
  // Lê apenas as últimas 100 linhas para ser rápido
  var startRow = Math.max(2, lastRow - 100); 
  var numRows = lastRow - startRow + 1;
  
  // Pega colunas A, B, C, D
  var data = sheet.getRange(startRow, 1, numRows, 4).getValues();
  var resultado = {};
  
  // Varre de baixo para cima (do mais recente para o antigo)
  for (var i = data.length - 1; i >= 0; i--) {
    var linha = data[i];
    var dataHora = linha[1]; // Coluna B
    var nomeMaquina = linha[2]; // Coluna C
    var evento = linha[3]; // Coluna D
    
    // Só processa se tiver nome de máquina
    if (nomeMaquina && nomeMaquina != "" && !resultado[nomeMaquina]) {
      
      // CONVERTE A DATA PARA NÚMERO (TIMESTAMP) PARA NÃO DAR ERRO NO HTML
      var timestamp = new Date(dataHora).getTime();
      
      if (!isNaN(timestamp)) { 
        resultado[nomeMaquina] = {
          ultimoEvento: evento,
          timestamp: timestamp
        };
      }
    }
  }
  return resultado;
}
