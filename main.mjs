import { app, BrowserWindow, ipcMain, clipboard, shell, net, powerMonitor } from 'electron'

import https from 'node:https'
// 文件顶部导入 Node.js  模块
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// 导入TTS相关模块
import { EdgeTTS } from 'node-edge-tts';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from "ffmpeg-static"

import { pathToFileURL, fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

// 设置FFmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))

// 存储已创建的临时文件路径
const tempFiles = new Set();

// 更新状态函数（用于向渲染进程发送状态更新）
function updateStatus(message) {
	if (mainWindow) {
		mainWindow.webContents.send('update-status', message);
	}
}

let mainWindow
const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1080,
		height: 700,
		minWidth: 930,
		minHeight: 660,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'icon.png'),
		webPreferences: {
			additionalArguments: ['--appversion=' + app.getVersion(), '--appname=' + app.name], // 传递应用ID参数
			devTools: !app.isPackaged,//是否启用开发者工具
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		},
	});

	// and load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Open the DevTools.
	// if (!app.isPackaged) {
	//   // mainWindow.webContents.openDevTools(true);
	// }
};

const VoiceList = [
	{
		"voice": "zh-CN-YunxiNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunxiNeural-1",
		"name": "云希",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunxiNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunxiNeural-2",
		"name": "云希2",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunxiaNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunxiaNeural-1",
		"name": "云夏",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunxiaNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunxiaNeural-2",
		"name": "云夏2",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunyangNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunyangNeural-1",
		"name": "云扬",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunyangNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunyangNeural-2",
		"name": "云扬2",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunjianNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunjianNeural-1",
		"name": "云健",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-YunjianNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-YunjianNeural-2",
		"name": "云健2",
		"language": "中文(男)"
	},
	{
		"voice": "zh-CN-XiaoxiaoNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-XiaoxiaoNeural-1",
		"name": "晓晓",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-XiaoxiaoNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-XiaoxiaoNeural-2",
		"name": "晓晓2",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-XiaoxiaoNeural",
		"pitch": "+20%",
		"rate": "10%",
		"volume": "+40%",
		"id": "zh-CN-XiaoxiaoNeural-3",
		"name": "晓晓3",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-XiaoyiNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-XiaoyiNeural-1",
		"name": "晓依",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-XiaoyiNeural",
		"pitch": "+10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-XiaoyiNeural-2",
		"name": "晓依2",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-liaoning-XiaobeiNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-liaoning-XiaobeiNeural-1",
		"name": "晓北",
		"language": "中文(女)"
	},
	{
		"voice": "zh-CN-shaanxi-XiaoniNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-CN-shaanxi-XiaoniNeural-1",
		"name": "晓妮",
		"language": "中文(女)"
	},
	{
		"voice": "zh-HK-HiuMaanNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-HK-HiuMaanNeural-1",
		"name": "慧曼",
		"language": "中文(女)"
	},
	{
		"voice": "zh-HK-HiuGaaiNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-HK-HiuGaaiNeural-1",
		"name": "慧洁",
		"language": "中文(女)"
	},
	{
		"voice": "zh-HK-WanLungNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-HK-WanLungNeural-1",
		"name": "宛融",
		"language": "中文(男)"
	},
	{
		"voice": "zh-TW-HsiaoChenNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-TW-HsiaoChenNeural-1",
		"name": "曉臻",
		"language": "中文(女)"
	},
	{
		"voice": "zh-TW-HsiaoYuNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-TW-HsiaoYuNeural-1",
		"name": "曉雨",
		"language": "中文(女)"
	},
	{
		"voice": "zh-TW-YunJheNeural",
		"pitch": "-10%",
		"rate": "-5%",
		"volume": "+40%",
		"id": "zh-TW-YunJheNeural-1",
		"name": "雲哲",
		"language": "中文(男)"
	}
]
// IPC处理程序

ipcMain.handle('get-voices', async () => {
	try {
		// 返回音色列表，包含参数
		return VoiceList;
	} catch (error) {
		console.error('获取音色列表失败:', error);
		throw error;
	}
});

ipcMain.handle('text-to-speech', async (event, text, voice) => {
	try {
		// 创建临时文件路径
		const tempDir = os.tmpdir();
		const timestamp = Date.now();
		const audioFileName = `tts_${timestamp}.mp3`;
		const audioFilePath = path.join(tempDir, audioFileName);
		console.log('audioFilePath:', audioFilePath);
		console.log(voice)
		// 使用EdgeTTS生成语音
		if (!text || !voice) {
			throw new Error('文本或音色未提供');
		}

		// 处理参数
		const pitch = voice.pitch !== undefined ? voice.pitch : "-10%";
		const rate = voice.rate !== undefined ? voice.rate : "-10%";
		const volume = voice.volume !== undefined ? voice.volume : "50%";

		const opts = {
			voice: voice.voice || 'zh-CN-XiaoxiaoNeural', // 默认音色
			pitch: pitch ,
			rate: rate, // 10 对应 0%
			volume: volume, // 50 对应 0%
			filepath: audioFilePath
		};

		console.log('TTS Options:', opts);
		const tts = new EdgeTTS({
			...opts,
			outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
			saveSubtitles: false,
			//proxy: 'http://localhost:7890',
			timeout: 50000
		});
		await tts.ttsPromise(text, audioFilePath);

		// 将文件路径添加到临时文件集合中
		tempFiles.add(audioFilePath);

		return {
			success: true,
			path: audioFilePath,
			filename: audioFileName
		};
	} catch (error) {
		console.error('文字转语音失败:', error);
		return {
			success: false,
			error: error.message
		};
	}
});

// 合并音频文件
ipcMain.handle('merge-audio-files', async (event, filePaths) => {
	try {
		if (!filePaths || filePaths.length < 2) {
			throw new Error('至少需要两个音频文件才能合并');
		}

		// 检查所有文件是否存在
		for (const filePath of filePaths) {
			if (!fs.existsSync(filePath)) {
				throw new Error(`文件不存在: ${filePath}`);
			}
		}

		// 创建输出文件路径
		const tempDir = os.tmpdir();
		const timestamp = Date.now();
		const outputFileName = `merged_${timestamp}.mp3`;
		const outputFilePath = path.join(tempDir, outputFileName);

		updateStatus('正在合并音频文件...');

		// 使用ffmpeg合并音频文件
		return new Promise((resolve, reject) => {
			const command = ffmpeg();

			// 添加所有输入文件
			filePaths.forEach(filePath => {
				command.input(filePath);
			});

			// 设置合并选项
			command
				.on('end', () => {
					// 将合并后的文件添加到临时文件集合中
					tempFiles.add(outputFilePath);

					resolve({
						success: true,
						path: outputFilePath,
						filename: outputFileName
					});
				})
				.on('error', (err) => {
					console.error('合并音频文件失败:', err);
					reject({
						success: false,
						error: `合并音频文件失败: ${err.message}`
					});
				})
				.on('progress', (progress) => {
					console.log('合并进度:', progress);
				})
				.mergeToFile(outputFilePath, tempDir);
		});
	} catch (error) {
		console.error('合并音频文件失败:', error);
		return {
			success: false,
			error: error.message
		};
	}
});

// 应用退出前清理临时文件
app.on('before-quit', () => {
	console.log('正在清理临时音频文件...');

	// 删除所有临时文件
	for (const filePath of tempFiles) {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				console.log(`已删除临时文件: ${filePath}`);
			}
		} catch (error) {
			console.error(`删除临时文件失败 ${filePath}:`, error);
		}
	}

	// 清空集合
	tempFiles.clear();
});

app.whenReady().then(() => {
	createWindow();

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});