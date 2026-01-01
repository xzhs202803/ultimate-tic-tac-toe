<template>
  <div class="app">
    <header>
      <h1>复合井字棋（在线）</h1>
    </header>

    <main>
      <section class="controls">
        <login-panel v-if="!loggedIn" :error="loginError" @login="handleLogin" />

        <div v-else>
          <input v-model="nick" placeholder="昵称（可选）" />
          <button @click="logout" style="margin-left:8px">注销</button>
          <input v-model="roomId" placeholder="房间号（空为新建）" />
          <select v-model="role">
            <option value="player">玩家</option>
            <option value="spectator">观战</option>
          </select>
          <label class="ai-option">
            <input type="checkbox" v-model="playWithAi" :disabled="role !== 'player'" />
            <span class="ai-option-content">
              <span class="ai-option-icon">🤖</span>
              <span class="ai-option-text">对战机器人</span>
            </span>
          </label>
          <button class="primary" @click="join">加入/创建房间</button>
          <button @click="resetGame" :disabled="!roomId">重置游戏</button>
          <button @click="reconnect">重新连接</button>
          <button @click="leaveRoom" :disabled="!roomId">退出房间</button>
          <button @click="clearLogs">清空日志</button>
          <share-panel v-if="roomId" :room-id="roomId" />
          <div class="muted" style="margin-left:8px">WS: <strong v-if="connected">已连接</strong><strong v-else>未连接</strong> （{{ url }}）</div>
          <div class="muted" style="margin-left:8px">客户端 ID: <strong>{{ clientId ?? '-' }}</strong></div>
        </div>
      </section>

      <aside v-if="!isPlaying" style="margin:12px 0">
        <lobby-panel :rooms="lobbyRooms" @refresh="requestLobby" @join="joinFromLobby" @spectate="spectateFromLobby" />
      </aside>
      <div class="error" v-if="lastError">错误：{{ lastError }}</div>

      <section v-if="state" class="game-area">
        <div class="top-row">
          <div class="meta-card">
            <div class="meta-row meta-header">
              <div class="room-id">房间：<strong>{{ state.roomId }}</strong></div>
              <button class="copy-btn" @click="copyRoomId">复制房间号</button>
            </div>

            <div class="meta-row">
              <div class="role">你的身份：<span class="player-label">{{ clientRoleLabel }}</span></div>
              <div class="spectators">观战：<span class="muted">{{ state.spectatorCount ?? 0 }}</span></div>
            </div>

            <div class="meta-row players">
              <div class="player-badge" :class="state.currentPlayer === 'X' ? 'active' : ''">
                <div class="sym">X</div>
                <div class="name">
                  <span>{{ state.players.X ?? '等待' }}</span>
                  <span v-if="state.players.X && state.players.X.includes('(AI)')" class="ai-tag">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-label">AI</span>
                  </span>
                </div>
              </div>
              <div class="vs">/</div>
              <div class="player-badge" :class="state.currentPlayer === 'O' ? 'active' : ''">
                <div class="sym">O</div>
                <div class="name">
                  <span>{{ state.players.O ?? '等待' }}</span>
                  <span v-if="state.players.O && state.players.O.includes('(AI)')" class="ai-tag">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-label">AI</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="meta-row status-row">
              <div class="turn">回合：<span class="badge" :class="state.currentPlayer === 'X' ? 'turn-x' : 'turn-o'">{{ state.currentPlayer }}</span></div>
              <div class="next-board">可落子小格：<strong>{{ state.nextAllowedBoard === -1 ? '任意' : state.nextAllowedBoard }}</strong></div>
            </div>

            <div class="meta-row helper">
              <div class="helper-text" :class="{ canMove: isMyTurn }">
                {{ helperText }}
              </div>
              <div style="margin-left:auto">
                <button v-if="meSymbol" @click="switchToSpectator">切换为观战</button>
                <button v-else @click="switchToPlayer" :disabled="!state.hasVacancy" :title="!state.hasVacancy ? '当前无空位或无法替换 AI' : '请求成为玩家'">请求加入为玩家</button>
              </div>
            </div>

            <!-- incoming join requests (visible to players) -->
            <div v-if="pendingJoinRequests.length && isPlaying" class="meta-row requests">
              <div class="muted">加入请求：</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <div v-for="(r, idx) in pendingJoinRequests" :key="r.id" style="background:#fff8eb;border:1px solid #ffdca3;padding:6px 8px;border-radius:8px;display:flex;gap:8px;align-items:center">
                  <div>{{ r.nick }}</div>
                  <button @click="dismissRequest(idx)">忽略</button>
                </div>
              </div>
            </div>
          </div>

          <div class="log" aria-live="polite">
            <div class="log-header"><h4>消息</h4><small class="muted">（仅保留最近 200 条）</small></div>
            <div class="log-list" ref="logList">
              <div v-for="(m, idx) in logs.slice(0,200)" :key="idx" class="log-item">{{ m }}</div>
            </div>
          </div>
        </div>

        <div v-if="state.winner" class="winner-overlay">
          <div class="winner-card">
            <div class="winner-text">胜者</div>
            <div class="winner-symbol" :class="state.winner === 'X' ? 'turn-x' : 'turn-o'">{{ state.winner }}</div>
            <button @click="resetGame" class="primary">重新开始</button>
          </div>
        </div>

        <ultimate-board
          :state="state"
          :meSymbol="meSymbol"
          :clientId="clientId"
          @move="sendMove"
        />
      </section>

      <section v-else class="hint">
        <p>请加入或创建房间来开始游戏（支持观战）。</p>
      </section>
    </main>

    <footer>
      <small>说明：规则为“嵌套井字棋”/Ultimate Tic-Tac-Toe。服务器为简单示例，仅用于学习与本地运行。</small>
    </footer>
  </div>
</template>

<script>
import UltimateBoard from './components/UltimateBoard.vue'
import SharePanel from './components/SharePanel.vue'
import LobbyPanel from './components/LobbyPanel.vue'
import LoginPanel from './components/LoginPanel.vue'

const WS_URL = (() => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (typeof location !== 'undefined') {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const port = import.meta.env.DEV ? '3000' : (location.port || '')
    const host = port ? `${location.hostname}:${port}` : location.hostname
    return `${proto}//${host}`
  }
  return 'ws://localhost:3000'
})()

export default {
  name: 'App',
  components: { UltimateBoard, SharePanel, LobbyPanel, LoginPanel },
  mounted() {
    // 如果 URL 中包含 room 参数，自动填入房间号（便于通过分享链接进入）
    try {
      const sp = new URLSearchParams(location.search)
      const r = sp.get('room')
      if (r) this.roomId = r
    } catch (e) {}

    // request initial lobby list when mounted (if connected later, we also request on open)
    this.lobbyRooms = []

    // auto-scroll log on updates
    this.$watch('logs', () => {
      this.$nextTick(() => {
        const el = this.$refs.logList
        if (el) el.scrollTop = 0 // newest at top
      })
    })

    // initialize login state
    this.loggedIn = false
    this.loginError = null

    // auto-login from cookie if present
    const saved = this.getCookie('uttt_nick')
    if (saved && saved.length) {
      // attempt to set nick on server
      this.handleLogin(saved)
    }

    // 在页面卸载/关闭时尝试主动注销昵称，保证昵称被及时释放
    this._onBeforeUnload = () => {
      try { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.send({ type: 'logout' }) } catch (e) {}
    }
    window.addEventListener('beforeunload', this._onBeforeUnload)
  },
  beforeUnmount() {
    try { window.removeEventListener('beforeunload', this._onBeforeUnload) } catch (e) {}
  },
  data() {
    return {
      url: WS_URL,
      ws: null,
      connected: false,
      roomId: '',
      role: 'player',
      playWithAi: false,
      playInLobby: false,
      nick: '',
      loggedIn: false,
      loginError: null,
      state: null,
      logs: [],
      lobbyRooms: [],
      clientId: null,
      meSymbol: null,
      lastError: null,
      // 存放收到的“加入玩家”请求（只对玩家可见）
      pendingJoinRequests: []
    }
  },
  computed: {
    clientRoleLabel() {
      if (!this.state) return this.role
      if (this.state.players[this.meSymbol]) return this.meSymbol
      return this.role
    },
    isPlaying() {
      return !!this.meSymbol
    },
    isMyTurn() {
      if (!this.meSymbol || !this.state) return false
      return this.state.currentPlayer === this.meSymbol
    },
    helperText() {
      if (!this.state) return ''
      if (!this.meSymbol) return '当前为观战者，可观看或申请成为玩家。'
      if (this.state.winner) return `游戏已结束，胜者：${this.state.winner}`
      if (this.isMyTurn) return '轮到你落子。请选择可落子小格中的空位。'
      return '等待对手操作...'
    }
  },
  methods: {
    connect() {
      if (this.ws) return
      this.ws = new WebSocket(this.url)
      this.ws.addEventListener('open', () => { this.connected = true; this.log('已连接'); /* requestLobby happens after login */ })
      this.ws.addEventListener('message', (ev) => this.onMessage(ev))
      this.ws.addEventListener('close', () => { this.connected = false; this.log('已断开'); this.ws = null })
      this.ws.addEventListener('error', (e) => this.log('WS 错误'))
    },

    // cookie helpers
    setCookie(name, value, days = 30) {
      const d = new Date()
      d.setTime(d.getTime() + (days*24*60*60*1000))
      const expires = "expires=" + d.toUTCString()
      document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
    },
    getCookie(name) {
      const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
      return v ? decodeURIComponent(v.pop()) : ''
    },
    deleteCookie(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    },
    resetGame() {
      if (!this.roomId) return
      this.send({ type: 'reset', roomId: this.roomId })
    },
    send(payload) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) { this.log('WS 未就绪'); return }
      this.ws.send(JSON.stringify(payload))
    },
    requestLobby() {
      if (!this.loggedIn) return
      this.send({ type: 'request_lobby' })
    },
    handleLogin(nick) {
      this.loginError = null
      this.connect()
      const sendNick = () => this.send({ type: 'set_nick', nick })
      // 总是通过 'open' 事件来发送昵称，避免竞态条件
      if (this.ws.readyState === WebSocket.OPEN) {
        sendNick()
      } else {
        const once = () => { sendNick(); this.ws.removeEventListener('open', once); }
        this.ws.addEventListener('open', once)
      }
    },
    join() {
      if (!this.loggedIn) { this.loginError = '请先登录昵称'; return }
      this.connect()
      const payload = { type: 'join', roomId: this.roomId || null, role: this.role, playWithAi: this.playWithAi }
      this.send(payload)
    },
    joinFromLobby(roomId) {
      if (!this.loggedIn) { this.loginError = '请先登录昵称'; return }
      // try to join as player (will become spectator if no vacancy)
      this.connect()
      this.roomId = roomId
      this.send({ type: 'join', roomId, role: 'player' })
    },
    spectateFromLobby(roomId) {
      if (!this.loggedIn) { this.loginError = '请先登录昵称'; return }
      this.connect()
      this.roomId = roomId
      this.send({ type: 'join', roomId, role: 'spectator' })
    },
    switchToSpectator() {
      if (!this.roomId) return
      this.send({ type: 'switch_role', roomId: this.roomId, role: 'spectator' })
    },
    switchToPlayer() {
      if (!this.roomId) return
      this.send({ type: 'switch_role', roomId: this.roomId, role: 'player' })
    },
    onMessage(ev) {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'nick_ok') {
          this.loggedIn = true
          this.nick = msg.nick
          this.loginError = null
          this.log('昵称已注册：' + msg.nick)
          // persist nick in cookie
          try { this.setCookie('uttt_nick', msg.nick, 30) } catch (e) {}
          // after login, request lobby snapshot
          this.requestLobby()
          return
        }
        if (msg.type === 'nick_taken') {
          // if auto-login from cookie failed, clear cookie
          if (this.getCookie('uttt_nick') === (msg.attempted || '')) this.deleteCookie('uttt_nick')
          this.loginError = msg.message || '昵称已被占用'
          return
        }
        if (msg.type === 'joined') {
          this.clientId = msg.clientId
          this.roomId = msg.roomId
          this.meSymbol = msg.symbol || null
          this.state = msg.state
          this.log(`已加入 ${msg.roomId}，身份：${msg.symbol ?? msg.role}`)
        } else if (msg.type === 'state') {
          this.state = msg.state
          // clear transient errors
          this.lastError = null
        } else if (msg.type === 'lobby') {
          this.lobbyRooms = msg.rooms || []
        } else if (msg.type === 'switched') {
          this.role = msg.role
          // ensure local meSymbol is cleared if becoming spectator
          this.meSymbol = msg.symbol || null
          this.log('已切换为：' + msg.role)
        } else if (msg.type === 'join_request') {
          // notify current players about spectator's request
          const from = msg.from || { id: '', nick: '未知' }
          // if current client is a player, record the request and log it
          if (this.isPlaying) {
            this.pendingJoinRequests.unshift(from)
            // keep only 10 recent
            if (this.pendingJoinRequests.length > 10) this.pendingJoinRequests.pop()
            this.log(`玩家请求加入：${from.nick}`)
          } else {
            // otherwise, ignore (or log for records)
            this.log(`收到加入请求（发送给玩家）：${from.nick}`)
          }
        } else if (msg.type === 'left') {
          // server acknowledged we left the room
          this.log('已退出房间')
          this.roomId = ''
          this.state = null
          this.meSymbol = null
        } else if (msg.type === 'error') {
          this.lastError = msg.message
          this.log('错误：' + msg.message)
          setTimeout(() => this.lastError = null, 5000)
        }
      } catch (e) { this.log('消息解析出错') }
    },
    sendMove({ boardIndex, cellIndex }) {
      this.send({ type: 'move', roomId: this.roomId, boardIndex, cellIndex })
    },
    reconnect() {
      if (this.ws) this.ws.close()
      this.ws = null
      this.connect()
    },
    clearLogs() { this.logs = [] },
    leaveRoom() {
      if (!this.roomId) return
      try { this.send({ type: 'leave', roomId: this.roomId }) } catch (e) {}
      // optimistic local clear; server will also confirm with a 'left' message
      this.roomId = ''
      this.state = null
      this.meSymbol = null
      this.pendingJoinRequests = []
      this.log('正在退出房间...')
    },
    dismissRequest(idx) {
      this.pendingJoinRequests.splice(idx, 1)
    },
    copyRoomId() {
      if (!this.roomId) return
      const text = this.roomId
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => this.log('已复制房间号')).catch(() => { try { prompt('复制房间号：', text) } catch (e) {} })
      } else {
        try { prompt('复制房间号：', text) } catch (e) { }
      }
    },
    logout() {
      // ensure we leave any room first
      try { if (this.roomId) this.send({ type: 'leave', roomId: this.roomId }) } catch (e) {}
      try { this.send({ type: 'logout' }) } catch (e) {}
      try { this.deleteCookie('uttt_nick') } catch (e) {}
      this.loggedIn = false
      this.nick = ''
      this.loginError = null
      this.log('已注销')
    },
    log(text) { this.logs.unshift(new Date().toLocaleTimeString() + ' ' + text) }
  }
}
</script>

<style scoped>
.app { font-family: inherit }
.game-area { display:flex; gap:20px; flex-wrap:wrap; justify-content:flex-start; align-items:flex-start; width:100% }
.top-row{display:flex;gap:20px;align-items:flex-start;justify-content:flex-start;width:100%;flex-wrap:wrap}
.top-row .meta-card{flex:1;min-width:260px;max-width:340px}
.top-row .log{flex:1;min-width:260px;max-width:400px}
@media (max-width:1024px){
  .game-area{justify-content:center}
  .top-row{justify-content:center}
  .top-row .meta-card,.top-row .log{max-width:100%}
}
@media (max-width:768px){
  .game-area{gap:12px;flex-direction:column;align-items:stretch}
  .top-row{flex-direction:column;gap:12px}
  .top-row .meta-card{min-width:auto;max-width:100%;padding:12px}
  .top-row .log{min-width:auto;max-width:100%;padding:12px;max-height:300px}
  .log-list{max-height:250px}
  .meta-row{padding:6px 0;font-size:0.9rem}
  .player-badge{min-width:80px;padding:8px 10px}
  .player-badge .sym{font-size:1.2rem}
  .player-badge .name{font-size:0.8rem;max-width:70px}
  .winner-card{padding:24px 20px}
  .winner-symbol{font-size:60px}
}
@media (max-width:480px){
  .top-row .meta-card{padding:10px}
  .top-row .log{padding:10px}
  .meta-row{gap:8px;padding:4px 0}
  .players{gap:8px;padding:8px 0}
  .player-badge{min-width:70px;padding:6px 8px;font-size:0.85rem}
  .player-badge .sym{font-size:1rem}
  .log-header{margin-bottom:8px;padding-bottom:8px;gap:6px}
  .log-item{padding:6px 8px;font-size:0.85rem}
}
.log{background:#fff;padding:16px;border-radius:var(--radius-lg);box-shadow:var(--shadow-md);display:flex;flex-direction:column}
.log-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
.log-header h4{margin:0;color:#1e293b;font-size:1rem;font-weight:600}
.log-header small{color:var(--muted);font-size:0.85rem}
.log-list{flex:1;max-height:420px;overflow-y:auto;display:flex;flex-direction:column-reverse}
.log-item{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;color:#475569;font-family:monospace}
.log-item:hover{background:#f8fafc}
.hint{color:var(--muted);padding:16px;text-align:center;background:#f9fafb;border-radius:var(--radius-lg);border:1px dashed #cbd5e1}

.badge{font-size:0.95rem;letter-spacing:0.5px}
.winner-overlay{
  position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:50;animation:fadeIn 0.2s ease
}
@keyframes fadeIn{from{opacity:0;backdrop-filter:blur(0)}to{opacity:1;backdrop-filter:blur(4px)}}
.winner-card{
  background:#fff;padding:32px;border-radius:var(--radius-lg);display:flex;flex-direction:column;align-items:center;gap:16px;
  box-shadow:var(--shadow-lg);animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)
}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.winner-text{font-size:1rem;color:var(--muted);font-weight:600;letter-spacing:1px}
.winner-symbol{font-size:80px;font-weight:900;line-height:1}
.winner-card button{margin-top:8px}

.meta-card{
  background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);padding:16px;border-radius:var(--radius-lg);
  box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:12px;border:1px solid #e2e8f0
}
.meta-row{
  display:flex;align-items:center;gap:12px;font-size:0.95rem;padding:8px 0;
  border-bottom:1px solid #e2e8f0;flex-wrap:wrap
}
.meta-row:last-child{border-bottom:none}
.meta-row strong{color:#1e293b;font-weight:600}
.meta-row.meta-header{justify-content:space-between;align-items:center;border-bottom:none;padding-bottom:8px}
.room-id{font-weight:600;color:#1e293b}
.copy-btn{padding:6px 10px;font-size:0.85rem}
.role{color:#1e293b;font-weight:600}
.player-label{display:inline-block;padding:4px 8px;background:#eef2ff;color:var(--accent);border-radius:var(--radius-sm);font-weight:600;font-size:0.9rem}
.spectators{color:var(--muted)}
.players{justify-content:flex-start;gap:16px;padding:12px 0;flex-wrap:wrap}
.player-badge{
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;background:#f9fafb;border-radius:var(--radius-md);
  border:1px solid #e2e8f0;min-width:100px;transition:all 0.2s
}
.player-badge.active{background:linear-gradient(135deg,#eef2ff 0%,#f0f4f8 100%);border-color:var(--accent);box-shadow:0 0 12px rgba(37,99,235,0.1)}
.player-badge .sym{font-size:1.5rem;font-weight:900;color:#1e293b}
.player-badge .name{font-size:0.85rem;color:var(--muted);text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px}
.ai-tag{
  display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);
  border-radius:999px;font-size:0.7rem;font-weight:600;color:#fff;white-space:nowrap;
  box-shadow:0 2px 6px rgba(245,158,11,0.25);animation:pulse-ai 2s ease-in-out infinite
}
.ai-icon{display:inline-flex;font-size:0.8rem;animation:float-ai 3s ease-in-out infinite}
.ai-label{font-size:0.65rem;letter-spacing:0.5px}
@keyframes pulse-ai{
  0%,100%{box-shadow:0 2px 6px rgba(245,158,11,0.25)}
  50%{box-shadow:0 2px 12px rgba(245,158,11,0.4)}
}
@keyframes float-ai{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-2px)}
}
@media (max-width:768px) {
  .ai-tag{animation:none;padding:2px 5px;font-size:0.65rem}
  .ai-icon{animation:none;font-size:0.75rem}
  .ai-label{font-size:0.6rem}
  .player-badge .name{font-size:0.8rem;max-width:80px;gap:3px}
}
@media (max-width:480px) {
  .ai-tag{padding:1px 4px;font-size:0.6rem}
  .ai-icon{font-size:0.7rem}
  .ai-label{font-size:0.55rem;letter-spacing:0}
  .player-badge .name{font-size:0.75rem;max-width:70px}
}
.vs{color:#cbd5e1;font-weight:700;font-size:1.2rem}
.turn{font-weight:600;color:#1e293b}
.next-board{color:var(--muted)}
.helper-text{
  padding:12px;background:#f9fafb;border-radius:var(--radius-md);border-left:3px solid #cbd5e1;color:var(--muted);font-size:0.9rem;
  margin:8px 0;width:100%;box-sizing:border-box
}
.helper-text.canMove{
  border-left-color:var(--success);background:#ecfdf5;color:#065f46;font-weight:500
}
.status-row{justify-content:space-between;flex-wrap:wrap}
.requests{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;border-bottom:none;padding:12px;background:#fef3c7;border-radius:var(--radius-md);margin:0}
.requests .muted{margin-right:0}
</style>