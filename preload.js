// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer, webUtils } = require('electron')

const AppName = process.argv.find(arg => /^\-\-appname\=/i.test(arg))?.replace('--appname=', '')
const AppVersion = process.argv.find(arg => /^\-\-appversion\=/i.test(arg))?.replace('--appversion=', '')

contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用名称
  AppName,
  // 获取应用版本号
  AppVersion,
  // 文字转语音功能
  textToSpeech: (text, voice) => ipcRenderer.invoke('text-to-speech', text, voice),
  // 获取音色列表
  getVoices: () => ipcRenderer.invoke('get-voices'),
  // 合并音频文件
  mergeAudioFiles: (filePaths) => ipcRenderer.invoke('merge-audio-files', filePaths),
  // 监听状态更新
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, message) => callback(message)),
  // 移除状态更新监听
  removeUpdateStatusListener: () => ipcRenderer.removeAllListeners('update-status')
})