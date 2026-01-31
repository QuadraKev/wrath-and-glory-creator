const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Get the characters directory path (works both in dev and packaged app)
function getCharactersPath() {
    // Characters folder is in extraResources when packaged, or __dirname in dev
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'characters');
    }
    return path.join(__dirname, 'characters');
}

// Ensure characters directory exists on startup
function ensureCharactersDir() {
    const charPath = getCharactersPath();
    if (!fs.existsSync(charPath)) {
        fs.mkdirSync(charPath, { recursive: true });
        console.log(`[Main] Created characters directory: ${charPath}`);
    }
}

// Get the data directory path
function getDataPath() {
    // __dirname works correctly both in dev and when packaged (including asar)
    const dataPath = path.join(__dirname, 'data');
    console.log(`[Main] Data path: ${dataPath}, isPackaged: ${app.isPackaged}`);
    return dataPath;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        backgroundColor: '#1a1a2e',
        show: false
    });

    mainWindow.loadFile('src/index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Remove menu bar for cleaner look
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    ensureCharactersDir();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers for file operations

// Load game data files
ipcMain.handle('load-game-data', async (event, filename) => {
    try {
        const dataPath = getDataPath();
        const filePath = path.join(dataPath, filename);
        console.log(`[Main] Loading game data: ${filename} from ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error(`[Main] File not found: ${filePath}`);
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`[Main] Successfully loaded ${filename}: ${Array.isArray(parsed) ? parsed.length + ' items' : 'object'}`);
        return parsed;
    } catch (error) {
        console.error(`[Main] Error loading ${filename}:`, error);
        return null;
    }
});

// List all character files
ipcMain.handle('list-characters', async () => {
    try {
        const charactersDir = getCharactersPath();
        if (!fs.existsSync(charactersDir)) {
            fs.mkdirSync(charactersDir, { recursive: true });
            return [];
        }
        const files = fs.readdirSync(charactersDir);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (error) {
        console.error('Error listing characters:', error);
        return [];
    }
});

// Load a character file
ipcMain.handle('load-character', async (event, characterName) => {
    try {
        const filePath = path.join(getCharactersPath(), `${characterName}.json`);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading character ${characterName}:`, error);
        return null;
    }
});

// Save a character file
ipcMain.handle('save-character', async (event, character) => {
    try {
        const charactersDir = getCharactersPath();
        if (!fs.existsSync(charactersDir)) {
            fs.mkdirSync(charactersDir, { recursive: true });
        }

        // Sanitize filename
        const safeName = character.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'unnamed';
        const filePath = path.join(charactersDir, `${safeName}.json`);

        fs.writeFileSync(filePath, JSON.stringify(character, null, 2));
        return { success: true, filename: safeName };
    } catch (error) {
        console.error('Error saving character:', error);
        return { success: false, error: error.message };
    }
});

// Delete a character file
ipcMain.handle('delete-character', async (event, characterName) => {
    try {
        const filePath = path.join(getCharactersPath(), `${characterName}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        console.error(`Error deleting character ${characterName}:`, error);
        return { success: false, error: error.message };
    }
});

// Show confirmation dialog (replaces browser confirm())
ipcMain.handle('show-confirm-dialog', async (event, message, title = 'Confirm') => {
    const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        title: title,
        message: message
    });
    // Refocus the main window after dialog closes
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.webContents.focus();
    }
    return result.response === 0; // true if 'Yes' was clicked
});

// Show message dialog (replaces browser alert())
ipcMain.handle('show-message-dialog', async (event, message, title = 'Information', type = 'info') => {
    await dialog.showMessageBox(mainWindow, {
        type: type,
        buttons: ['OK'],
        title: title,
        message: message
    });
    // Refocus the main window after dialog closes
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.webContents.focus();
    }
});

// Show save dialog for export
ipcMain.handle('show-save-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Character',
        defaultPath: defaultName,
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    // Refocus the main window after dialog closes to restore input focus
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.webContents.focus();
    }
    return result;
});

// Show open dialog for import
ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Character',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
    // Refocus the main window after dialog closes to restore input focus
    if (mainWindow) {
        mainWindow.focus();
        mainWindow.webContents.focus();
    }
    return result;
});

// Export character to specific path
ipcMain.handle('export-character', async (event, character, filePath) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(character, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Error exporting character:', error);
        return { success: false, error: error.message };
    }
});

// Import character from specific path
ipcMain.handle('import-character', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return { success: true, character: JSON.parse(data) };
    } catch (error) {
        console.error('Error importing character:', error);
        return { success: false, error: error.message };
    }
});

// Export character sheet to PDF
ipcMain.handle('export-pdf', async (event, options) => {
    try {
        const win = BrowserWindow.getFocusedWindow() || mainWindow;
        if (!win) {
            return { success: false, error: 'No window available' };
        }

        const { filePath, canceled } = await dialog.showSaveDialog(win, {
            title: 'Export Character Sheet to PDF',
            defaultPath: options.filename || 'character-sheet.pdf',
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]
        });

        // Refocus the main window after dialog closes
        if (mainWindow) {
            mainWindow.focus();
            mainWindow.webContents.focus();
        }

        if (canceled || !filePath) {
            return { success: false, error: 'cancelled' };
        }

        // Generate PDF from the current window contents (no print media query)
        const pdfData = await win.webContents.printToPDF({
            printBackground: true,
            pageSize: 'Letter',
            margins: {
                top: 0.5,
                bottom: 0.5,
                left: 0.5,
                right: 0.5
            }
        });

        fs.writeFileSync(filePath, pdfData);

        // Open the PDF automatically
        shell.openPath(filePath);

        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error exporting PDF:', error);
        return { success: false, error: error.message };
    }
});
