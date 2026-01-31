const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('api', {
    // Game data loading
    loadGameData: (filename) => ipcRenderer.invoke('load-game-data', filename),

    // Character file operations
    listCharacters: () => ipcRenderer.invoke('list-characters'),
    loadCharacter: (name) => ipcRenderer.invoke('load-character', name),
    saveCharacter: (character) => ipcRenderer.invoke('save-character', character),
    deleteCharacter: (name) => ipcRenderer.invoke('delete-character', name),

    // Import/Export
    showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
    exportCharacter: (character, filePath) => ipcRenderer.invoke('export-character', character, filePath),
    importCharacter: (filePath) => ipcRenderer.invoke('import-character', filePath),

    // PDF Export
    exportPDF: (options) => ipcRenderer.invoke('export-pdf', options),

    // Native dialogs (better focus handling than browser confirm/alert)
    showConfirm: (message, title) => ipcRenderer.invoke('show-confirm-dialog', message, title),
    showMessage: (message, title, type) => ipcRenderer.invoke('show-message-dialog', message, title, type)
});
