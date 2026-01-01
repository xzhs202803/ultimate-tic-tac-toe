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
            <td class="players-cell">{{ r.players.X || '等待' }} / {{ r.players.O || '等待' }}</td>
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
.lobby-panel {
  background: #fff;
  padding: 12px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
  gap: 8px;
}

.header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 700;
}

.btn-refresh {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn-refresh:hover {
  border-color: var(--accent);
  background: #f0f4f8;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.1);
}

.rooms-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.rooms-container::-webkit-scrollbar {
  width: 6px;
}

.rooms-container::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.rooms-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.rooms {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.rooms thead {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  border-bottom: 2px solid #cbd5e1;
  position: sticky;
  top: 0;
}

.rooms th {
  padding: 8px 6px;
  text-align: left;
  color: #1e293b;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rooms td {
  padding: 8px 6px;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}

.room-row:hover {
  background: #f9fafb;
}

.room-id-cell {
  font-family: monospace;
  font-weight: 700;
  color: #1e293b;
}

.room-id-cell code {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 100%);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.players-cell,
.spectators-cell {
  text-align: center;
  font-size: 0.85rem;
}

.status-cell {
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.btn {
  padding: 5px 8px;
  border-radius: var(--radius-md);
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: #f0f4f8;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%);
  color: #fff;
  border-color: transparent;
  font-weight: 700;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 5px 8px;
  font-size: 0.75rem;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-open {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.badge-full {
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
}

.empty {
  text-align: center;
  padding: 20px 12px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.empty svg {
  color: #cbd5e1;
  margin-bottom: 10px;
  width: 40px;
  height: 40px;
}

.empty p {
  margin: 8px 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
}

.empty small {
  display: block;
  color: var(--muted);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .lobby-panel {
    padding: 10px;
  }

  .header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .header h3 {
    font-size: 0.95rem;
  }

  .btn-refresh {
    padding: 5px 10px;
    font-size: 0.8rem;
  }

  .rooms {
    font-size: 0.8rem;
  }

  .rooms th {
    padding: 6px 4px;
    font-size: 0.75rem;
  }

  .rooms td {
    padding: 6px 4px;
  }

  .btn-sm {
    padding: 4px 6px;
    font-size: 0.7rem;
  }

  .actions-cell {
    flex-direction: column;
    gap: 2px;
  }
}
</style>