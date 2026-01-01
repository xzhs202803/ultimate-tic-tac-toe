<template>
  <div class="lobby-panel">
    <div class="header">
      <h3>大厅</h3>
      <button class="btn-refresh" @click="$emit('refresh')">🔄 刷新</button>
    </div>
    <div v-if="rooms && rooms.length" class="rooms-container">
      <table class="rooms">
        <thead>
          <tr>
            <th>房间</th>
            <th>玩家</th>
            <th>观战</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rooms" :key="r.roomId" class="room-row">
            <td class="room-id-cell"><code>{{ r.roomId }}</code></td>
            <td class="players-cell">
              <span class="player-info">
                {{ r.players.X || '等待' }}
                <span v-if="r.players.X && r.players.X.includes('(AI)')" class="ai-badge-small">🤖AI</span>
              </span>
              /
              <span class="player-info">
                {{ r.players.O || '等待' }}
                <span v-if="r.players.O && r.players.O.includes('(AI)')" class="ai-badge-small">🤖AI</span>
              </span>
            </td>
            <td class="spectators-cell">{{ r.spectatorCount }}</td>
            <td class="status-cell">
              <span class="badge" :class="r.hasVacancy ? 'badge-open' : 'badge-full'">
                {{ r.hasVacancy ? '可加入' : '满' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="btn btn-sm" @click="$emit('spectate', r.roomId)">观战</button>
              <button class="btn btn-sm btn-primary" @click="$emit('join', r.roomId)" :disabled="!r.hasVacancy">加入</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>
      </svg>
      <p>暂无房间</p>
      <small>创建房间后，其他玩家可以加入</small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LobbyPanel',
  props: ['rooms']
}
</script>

<style scoped>
.lobby-panel{background:#fff;padding:16px;border-radius:var(--radius-lg);box-shadow:var(--shadow-md);border:1px solid #e2e8f0}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
.header h3{margin:0;color:#1e293b;font-size:1.1rem;font-weight:600}
.btn-refresh{padding:8px 14px;border-radius:var(--radius-md);border:1px solid #cbd5e1;background:#fff;color:#1e293b;cursor:pointer;font-weight:500;transition:all 0.2s;font-size:0.9rem}
.btn-refresh:hover{border-color:var(--accent);background:#f0f4f8}
.rooms-container{overflow-x:auto}
.rooms{width:100%;border-collapse:collapse;font-size:0.95rem}
.rooms thead{background:#f8fafc;border-bottom:2px solid #e2e8f0}
.rooms th{padding:10px 8px;text-align:left;color:#1e293b;font-weight:600;font-size:0.9rem}
.rooms td{padding:10px 8px;border-bottom:1px solid #f1f5f9;color:#475569}
.room-row:hover{background:#f9fafb}
.room-id-cell{font-family:monospace;font-weight:600;color:#1e293b}
.room-id-cell code{background:#f1f5f9;padding:2px 6px;border-radius:var(--radius-sm);font-size:0.9rem}
.players-cell,.spectators-cell{text-align:center}
.player-info{display:inline-flex;align-items:center;gap:4px}
.ai-badge-small{
  display:inline-flex;align-items:center;gap:1px;padding:1px 4px;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);
  border-radius:999px;font-size:0.7rem;font-weight:600;color:#fff;white-space:nowrap;
  box-shadow:0 1px 4px rgba(245,158,11,0.25)
}
@media (max-width:768px) {
  .ai-badge-small{font-size:0.65rem;padding:1px 3px;gap:0.5px}
}
@media (max-width:480px) {
  .player-info{gap:2px}
  .ai-badge-small{font-size:0.6rem;padding:0.5px 2px}
}
.status-cell{text-align:center}
.actions-cell{display:flex;gap:6px;justify-content:flex-end}
.btn{padding:7px 12px;border-radius:var(--radius-md);border:1px solid #cbd5e1;background:#fff;color:#1e293b;cursor:pointer;font-weight:500;font-size:0.9rem;transition:all 0.2s}
.btn:hover:not(:disabled){border-color:var(--accent);background:#f0f4f8}
.btn-primary{background:linear-gradient(135deg,var(--accent) 0%,#1d4ed8 100%);color:#fff;border-color:transparent}
.btn-primary:hover:not(:disabled){box-shadow:0 4px 12px rgba(37,99,235,0.3)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-sm{padding:6px 10px;font-size:0.85rem}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:0.85rem;font-weight:600}
.badge-open{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
.badge-full{background:#fee2e2;color:#7f1d1d;border:1px solid #fecaca}
.empty{text-align:center;padding:32px 16px;color:var(--muted)}
.empty svg{color:#cbd5e1;margin-bottom:12px}
.empty p{margin:12px 0;font-size:1rem;color:#1e293b;font-weight:600}
.empty small{display:block;color:var(--muted);font-size:0.9rem}
@media (max-width:768px){
  .lobby-panel{padding:12px}
  .header{margin-bottom:12px;flex-direction:column;align-items:stretch;gap:8px}
  .btn-refresh{width:100%;padding:8px 10px}
  .rooms{font-size:0.85rem}
  .rooms th,.rooms td{padding:8px 6px}
  .room-id-cell code{font-size:0.85rem}
  .actions-cell{flex-direction:column;gap:4px}
  .btn-sm{width:100%;min-width:unset}
}
@media (max-width:480px){
  .lobby-panel{padding:10px;border-radius:8px}
  .header h3{font-size:1rem}
  .rooms{font-size:0.8rem}
  .rooms th,.rooms td{padding:6px 4px}
  .room-id-cell code{padding:2px 4px;font-size:0.75rem}
  .btn{padding:5px 8px;font-size:0.8rem}
  .btn-sm{padding:5px 8px}
}
</style>