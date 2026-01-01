# 生产环境一键启动脚本 (Windows PowerShell)
# 使用方法: .\start-prod.ps1 [-Port 3000]

param(
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "复合井字棋 - 生产环境启动" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 dist 目录
if (!(Test-Path "dist")) {
    Write-Host "❌ 错误: dist 目录不存在，请先运行部署脚本构建项目" -ForegroundColor Red
    Write-Host "   .\deploy.ps1 -WsUrl `"wss://your-domain.com/ws`"" -ForegroundColor Yellow
    exit 1
}

# 检查 pm2
$pm2Installed = $null
try {
    $pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
} catch {}

if ($pm2Installed) {
    Write-Host "🚀 使用 pm2 启动服务..." -ForegroundColor Yellow
    
    # 停止旧进程
    try {
        pm2 delete uttt-ws 2>$null
    } catch {}
    
    # 启动 WebSocket 服务器
    pm2 start server/index.cjs --name uttt-ws
    pm2 save
    
    Write-Host ""
    Write-Host "✅ 服务已启动！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 查看状态:" -ForegroundColor Cyan
    Write-Host "   pm2 status"
    Write-Host "   pm2 logs uttt-ws"
    Write-Host "   pm2 monit"
    Write-Host ""
    Write-Host "🛑 停止服务:" -ForegroundColor Cyan
    Write-Host "   pm2 stop uttt-ws"
    Write-Host "   pm2 delete uttt-ws"
} else {
    Write-Host "⚠️  未检测到 pm2，使用直接启动（按 Ctrl+C 停止）" -ForegroundColor Yellow
    Write-Host ""
    node server/index.cjs
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 服务信息:" -ForegroundColor Cyan
Write-Host "   WebSocket: ws://0.0.0.0:$Port"
Write-Host "   静态文件: $(Get-Location)\dist"
Write-Host ""
Write-Host "⚠️  提醒: 请使用 IIS/Nginx 提供 dist\ 目录的静态文件服务" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
