#!/usr/bin/env node
/**
 * 生产环境一键启动脚本 (跨平台 Node.js)
 * 使用方法: node start-prod.js [port]
 * 默认端口: 3000
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3000;
const isWindows = process.platform === 'win32';

console.log('==========================================');
console.log('复合井字棋 - 生产环境启动');
console.log('==========================================\n');

// 检查 dist 目录
if (!fs.existsSync('dist')) {
  console.error('❌ 错误: dist 目录不存在，请先运行部署脚本构建项目');
  console.error('   node deploy.js wss://your-domain.com/ws');
  process.exit(1);
}

// 检查 pm2
function checkPm2() {
  try {
    execSync('pm2 -v', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 启动服务
async function start() {
  if (checkPm2()) {
    console.log('🚀 使用 pm2 启动服务...\n');
    
    // 停止旧进程
    try {
      execSync('pm2 delete uttt-ws', { stdio: 'ignore' });
    } catch {}
    
    // 启动 WebSocket 服务器
    execSync('pm2 start server/index.cjs --name uttt-ws', { stdio: 'inherit' });
    execSync('pm2 save', { stdio: 'inherit' });
    
    console.log('\n✅ 服务已启动！\n');
    console.log('📊 查看状态:');
    console.log('   pm2 status');
    console.log('   pm2 logs uttt-ws');
    console.log('   pm2 monit\n');
    console.log('🛑 停止服务:');
    console.log('   pm2 stop uttt-ws');
    console.log('   pm2 delete uttt-ws');
    
  } else {
    console.log('⚠️  未检测到 pm2，使用直接启动（按 Ctrl+C 停止）\n');
    
    // 直接启动
    const serverProcess = spawn('node', ['server/index.cjs'], {
      stdio: 'inherit',
      shell: false
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ 启动失败:', error.message);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`\n服务已停止 (退出码: ${code})`);
      process.exit(code);
    });
    
    // 处理退出信号
    process.on('SIGINT', () => {
      console.log('\n正在停止服务...');
      serverProcess.kill('SIGTERM');
    });
  }
  
  console.log('\n==========================================');
  console.log('📋 服务信息:');
  console.log(`   WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`   静态文件: ${path.resolve(__dirname, 'dist')}`);
  console.log('\n⚠️  提醒: 请使用 Nginx/IIS 提供 dist/ 目录的静态文件服务');
  console.log('==========================================\n');
}

// 运行
start().catch(error => {
  console.error('\n❌ 启动失败:', error.message);
  process.exit(1);
});
