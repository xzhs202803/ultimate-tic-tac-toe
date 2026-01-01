<template>
  <div class="ultimate">
    <div class="board-grid">
      <small-board
        v-for="(b, i) in boards"
        :key="i"
        :index="i"
        :cells="b.cells"
        :owner="b.owner"
        :nextAllowedBoard="state.nextAllowedBoard"
        :active="isBoardActive(i)"
        :currentPlayer="state.currentPlayer"
        :meSymbol="meSymbol"
        @cell-click="onCellClick"
      />
    </div>
  </div>
</template>

<script>
import SmallBoard from './SmallBoard.vue'
export default {
  name: 'UltimateBoard',
  components: { SmallBoard },
  props: ['state', 'meSymbol', 'clientId'],
  computed: {
    boards() { return this.state ? this.state.boards : [] }
  },
  methods: {
    isBoardActive(i) {
      if (!this.state) return false
      if (this.state.winner) return false
      if (this.state.nextAllowedBoard === -1) return true
      return this.state.nextAllowedBoard === i
    },
    onCellClick({ boardIndex, cellIndex }) {
      this.$emit('move', { boardIndex, cellIndex })
    }
  }
}
</script>

<style scoped>
.ultimate {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  aspect-ratio: 1;
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: 600px;
}

/* PC 端优化（1920x1080） */
@media (min-width: 1400px) {
  .ultimate {
    padding: 10px;
  }

  .board-grid {
    max-width: 580px;
    max-height: 580px;
    gap: 12px;
  }
}

/* 平板优化 */
@media (max-width: 1399px) and (min-width: 769px) {
  .ultimate {
    padding: 10px;
  }

  .board-grid {
    max-width: 500px;
    max-height: 500px;
    gap: 10px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .ultimate {
    padding: 8px;
  }

  .board-grid {
    max-width: 100%;
    max-height: 100%;
    gap: 8px;
  }
}

/* 小手机屏幕 */
@media (max-width: 480px) {
  .ultimate {
    padding: 6px;
  }

  .board-grid {
    gap: 6px;
  }
}
</style>