const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// Define o caminho do banco de dados
// Em produção: pasta de dados do usuário (AppData/Roaming)
// Em desenvolvimento: raiz do projeto (ao lado do package.json)
const isDev = process.env.NODE_ENV !== 'production';
const dbPath = isDev 
  ? path.join(__dirname, '../dados_oficina.db') 
  : path.join(app.getPath('userData'), 'dados_oficina.db');

console.log(`Banco de dados localizado em: ${dbPath}`);

// Inicializa o banco
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL'); // Melhora performance e evita travamentos

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Garanta que preload.js está na pasta electron
      nodeIntegration: false,
      contextIsolation: true
    },
    // Ícone da janela (ajuste o caminho se necessário)
    icon: path.join(__dirname, '../public/favicon.svg')
  });

  if (isDev) {
    // No modo dev, carrega a URL do Vite
    mainWindow.loadURL('http://localhost:5173');
    // Abre o DevTools para debug
    //mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega o arquivo compilado
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // --- HANDLERS DE BANCO DE DADOS (A Ponte React <-> Node) ---

  // Handler Genérico de Execução (INSERT, UPDATE, DELETE, CREATE TABLE)
  ipcMain.handle('db-exec', async (event, sql, params) => {
    try {
      // CORREÇÃO DO ERRO "RangeError":
      // Se existirem parâmetros, é uma query específica (ex: login, insert) -> usa prepare()
      if (params && params.length > 0) {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
      } 
      // Se NÃO houver parâmetros, assumimos que é um script (ex: Migrations) -> usa exec()
      // db.exec suporta múltiplos comandos separados por ponto e vírgula
      else {
        db.exec(sql);
        return { changes: 0, lastInsertRowid: 0 };
      }
    } catch (err) {
      console.error("Erro no Handler db-exec:", err);
      throw err; // Repassa o erro para o frontend tratar
    }
  });

  // Handler de Consulta - Vários Resultados (SELECT * FROM ...)
  ipcMain.handle('db-query-all', async (event, sql, params) => {
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...(params || []));
    } catch (err) {
      console.error("Erro no Handler db-query-all:", err);
      throw err;
    }
  });

  // Handler de Consulta - Único Resultado (SELECT ... LIMIT 1)
  ipcMain.handle('db-query-one', async (event, sql, params) => {
    try {
      const stmt = db.prepare(sql);
      return stmt.get(...(params || []));
    } catch (err) {
      console.error("Erro no Handler db-query-one:", err);
      throw err;
    }
  });
});

// Comportamento padrão de fechar a janela (exceto no Mac)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});