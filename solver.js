// solver.js
class PuzzleSolver {
  constructor(ui) {
    this.ui = ui;
    this.isSolving = false;
    this.solutionSteps = [];
    this.stepIndex = 0;
    this.solveTimeout = null;
    this.initControls();
  }

  // 初始化控制按钮
  initControls() {
    const autoSolveBtn = document.getElementById('auto-solve');
    // const pauseBtn = document.getElementById('pause-button');

    autoSolveBtn.addEventListener('click', () => {
      if (this.isSolving) this.stop();
      else this.start();
    });

    // pauseBtn.addEventListener('click', () => {
    //   this.isPaused = !this.isPaused;
    //   pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    //   if (!this.isPaused) this.playNextStep();
    // });
  }

  // 启动解谜流程
  start() {
    if (this.isSolving) return;
    this.isSolving = true;

    try {
      const initialState = this.getCurrentState();
      this.solutionSteps = this.optimizedIDAStar(initialState);

      if (!this.solutionSteps?.length) {
        alert("当前状态无解！请重新开始");
        return this.stop();
      }

      document.getElementById('auto-solve').textContent = '停止解谜';
      this.stepIndex = 0;
      this.playNextStep();
    } catch (error) {
      console.error('解谜错误:', error);
      this.stop();
      alert("解谜失败：内存不足，请尝试降低难度");
    }
  }

  // 停止解谜
  stop() {
    this.isSolving = false;
    this.isPaused = false;
    this.solutionSteps = [];
    document.getElementById('auto-solve').textContent = '自动解';
  }

  // 执行下一步
  playNextStep() {
    if (!this.isSolving) return;
    if (this.stepIndex >= this.solutionSteps.length) {
      this.ui.showWinAlert();
      return this.stop();
    }

    const direction = this.solutionSteps[this.stepIndex];
    this.ui.handleMove(direction);
    this.stepIndex++;

    setTimeout(() => this.playNextStep(), 300); // 300ms/步
  }

  // 获取当前状态（优化表示）
  getCurrentState() {
    return {
      tiles: [...this.ui.game.tiles],
      emptyIndex: this.ui.game.emptyIndex,
      size: this.ui.game.size
    };
  }

  // 优化后的IDA*算法
  optimizedIDAStar(initialState) {
    const MAX_DEPTH = 80;    // 最大搜索深度
    const MAX_MEMORY = 1e6;  // 最大缓存条目

    let threshold = this.calcHeuristic(initialState);
    const cache = new LRUCache(MAX_MEMORY);

    for (let iter = 0; iter < 100; iter++) {
      const result = this.memorySafeSearch(
        initialState,
        0,
        threshold,
        [],
        cache,
        MAX_DEPTH
      );

      if (result.found) return result.path;
      if (result.memoryExceeded) break;

      threshold = result.threshold;
      cache.clear();
    }
    return null;
  }

  // 带内存保护的搜索
  memorySafeSearch(state, g, threshold, path, cache, maxDepth) {
    if (g > maxDepth) return { found: false, threshold: Infinity };
    if (cache.size >= cache.maxSize) return { memoryExceeded: true };

    const h = this.calcHeuristic(state);
    const f = g + h;
    if (f > threshold) return { found: false, threshold: f };
    if (this.isSolved(state)) return { found: true, path: [...path] };

    let minThreshold = Infinity;
    const moves = this.getPossibleMoves(state);

    for (const move of moves) {
      const newState = this.applyMove(state, move);
      const stateKey = newState.tiles.join(',');

      if (cache.has(stateKey)) continue;
      cache.set(stateKey, true);

      const result = this.memorySafeSearch(
        newState,
        g + 1,
        threshold,
        [...path, move.direction],
        cache,
        maxDepth
      );

      cache.delete(stateKey);

      if (result.found) return result;
      if (result.memoryExceeded) return result;
      if (result.threshold < minThreshold) minThreshold = result.threshold;
    }

    return { found: false, threshold: minThreshold };
  }

  // 计算曼哈顿距离启发值
  calcHeuristic(state) {
    let distance = 0;
    const size = state.size;

    for (let i = 0; i < state.tiles.length; i++) {
      const num = state.tiles[i];
      if (!num) continue;

      const targetRow = Math.floor((num - 1) / size);
      const targetCol = (num - 1) % size;
      const currentRow = Math.floor(i / size);
      const currentCol = i % size;

      distance += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
    }
    return distance;
  }

  // 验证是否完成
  isSolved(state) {
    return state.tiles.every((num, i) => !num || num === i + 1);
  }

  // 获取合法移动方向
  getPossibleMoves(state) {
    const size = state.size;
    const emptyIndex = state.emptyIndex;
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;
    const moves = [];

    if (row > 0) moves.push({ direction: 'ArrowDown', target: emptyIndex - size });
    if (row < size - 1) moves.push({ direction: 'ArrowUp', target: emptyIndex + size });
    if (col > 0) moves.push({ direction: 'ArrowRight', target: emptyIndex - 1 });
    if (col < size - 1) moves.push({ direction: 'ArrowLeft', target: emptyIndex + 1 });

    return moves;
  }

  // 应用移动生成新状态
  applyMove(oldState, move) {
    const newTiles = [...oldState.tiles];
    [newTiles[oldState.emptyIndex], newTiles[move.target]] =
      [newTiles[move.target], newTiles[oldState.emptyIndex]];

    return {
      tiles: newTiles,
      emptyIndex: move.target,
      size: oldState.size
    };
  }
}

// LRU缓存实现
class LRUCache {
  constructor(maxSize = 1e5) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  has(key) {
    return this.cache.has(key);
  }

  get(key) {
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// 初始化解题器（等待GameUI实例创建）
window.addEventListener('DOMContentLoaded', () => {
  // 等待GameUI初始化完成
  setTimeout(() => {
    if (window.gameUI) {
      new PuzzleSolver(window.gameUI);
    }
  }, 100);
});