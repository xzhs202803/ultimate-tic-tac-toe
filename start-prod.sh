#!/bin/bash
# 生产环境一键启动脚本 (Linux/macOS)
# 使用方法: ./start-prod.sh [port]
# 默认端口: 3000 (WebSocket)

set -e

WS_PORT="${1:-3000}"

echo "=========================================="
echo "复合井字棋 - 生产环境启动"
echo "=========================================="
echo ""

# 检查 dist 目录
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist 目录不存在，请先运行部署脚本构建项目"
    echo "   ./deploy.sh wss://your-domain.com/ws"
    exit 1
fi

# 检查 pm2
if command -v pm2 &> /dev/null; then
    echo "🚀 使用 pm2 启动服务..."
    
    # 停止旧进程
    pm2 delete uttt-ws 2>/dev/null || true
    
    # 启动 WebSocket 服务器
    pm2 start server/index.cjs --name uttt-ws
    pm2 save
    
    echo ""
    echo "✅ 服务已启动！"
    echo ""
    echo "📊 查看状态:"
    echo "   pm2 status"
    echo "   pm2 logs uttt-ws"
    echo "   pm2 monit"
    echo ""
    echo "🛑 停止服务:"
    echo "   pm2 stop uttt-ws"
    echo "   pm2 delete uttt-ws"
else
    echo "⚠️  未检测到 pm2，使用直接启动（按 Ctrl+C 停止）"
    echo ""
    node server/index.cjs
fi

echo ""
echo "=========================================="
echo "📋 服务信息:"
echo "   WebSocket: ws://0.0.0.0:${WS_PORT}"
echo "   静态文件: $(pwd)/dist"
echo ""
echo "⚠️  提醒: 请使用 Nginx/Apache 提供 dist/ 目录的静态文件服务"
echo "=========================================="
