// script.js
class GameState {
    constructor(size = 3) {
        this.size = size;
        this.moves = 0;
        this.tiles = [];
        this.emptyIndex = -1;
        this.init();
    }

    init() {
        this.shuffle(); // 使用动态调整的步数
        this.history = [...this.tiles]; // 保存初始状态用于重置
    }

    shuffle(steps) {
        // 根据难度动态调整打乱步数，更大的棋盘需要更多步数
        const adjustedSteps = steps || 150 + Math.floor(Math.random() * 150) + (this.size - 3) * 100;
        // 已完成状态
        this.tiles = [...Array(this.size * this.size - 1).keys()].map(i => i + 1).concat(0);
        this.emptyIndex = this.size * this.size - 1;

        // 随机“反向”移动空格 - 确保生成可解谜题
        const dirs = [-1, 1, -this.size, this.size]; // 左、右、上、下
        for (let i = 0; i < adjustedSteps; i++) {
            const candidates = dirs
                .map(d => this.emptyIndex + d)
                .filter(ni => ni >= 0 && ni < this.size * this.size && 
                           Math.abs(this.rc(ni).c - this.rc(this.emptyIndex).c) + 
                           Math.abs(this.rc(ni).r - this.rc(this.emptyIndex).r) === 1);
            if (!candidates.length) continue;
            const next = candidates[Math.floor(Math.random() * candidates.length)];
            [this.tiles[this.emptyIndex], this.tiles[next]] = [this.tiles[next], this.tiles[this.emptyIndex]];
            this.emptyIndex = next;
        }
    }

    // 工具方法
    idx(r, c) { return r * this.size + c; }
    rc(i) { return { r: Math.floor(i / this.size), c: i % this.size }; }

    checkSolvability(numbers) {
        const size = Math.sqrt(numbers.length);
        const arr = numbers.filter(n => n !== 0);
        let inversions = 0;
        
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                inversions += arr[i] > arr[j] ? 1 : 0;
            }
        }
        
        if (size % 2 === 1) return inversions % 2 === 0;
        const emptyRow = Math.floor(numbers.indexOf(0) / size);
        return (inversions + emptyRow) % 2 === 0;
    }

    move(direction) {
        const newIndex = this.getTargetIndex(direction);
        if (newIndex === -1) return false;
        
        [this.tiles[this.emptyIndex], this.tiles[newIndex]] = 
        [this.tiles[newIndex], this.tiles[this.emptyIndex]];
        
        this.emptyIndex = newIndex;
        this.moves++;
        return true;
    }

    getTargetIndex(direction) {
        const row = Math.floor(this.emptyIndex / this.size);
        const col = this.emptyIndex % this.size;
        let newIndex = -1;
        
        switch(direction) {
            case 'ArrowUp': newIndex = row < this.size-1 ? this.emptyIndex + this.size : -1; break;
            case 'ArrowDown': newIndex = row > 0 ? this.emptyIndex - this.size : -1; break;
            case 'ArrowLeft': newIndex = col < this.size-1 ? this.emptyIndex + 1 : -1; break;
            case 'ArrowRight': newIndex = col > 0 ? this.emptyIndex - 1 : -1; break;
        }
        return newIndex;
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) return false;
        }
        return this.tiles[this.tiles.length - 1] === 0;
    }

    reset() {
        // 恢复到初始状态
        this.tiles = [...this.history];
        this.moves = 0;
        // 重新计算空方块位置
        this.emptyIndex = this.tiles.indexOf(0);
    }
}

class GameUI {
    constructor() {
        this.board = document.getElementById('puzzle-board');
        this.moveCounter = document.getElementById('move-counter');
        this.timeCounter = document.getElementById('time-counter');
        
        // 安全创建难度显示
        this.difficultyDisplay = document.getElementById('difficulty-display');
        if (!this.difficultyDisplay) {
            this.difficultyDisplay = document.createElement('p');
            this.difficultyDisplay.id = 'difficulty-display';
            this.difficultyDisplay.style.textAlign = 'center';
            this.difficultyDisplay.style.marginBottom = '15px';
            document.querySelector('.game-container').prepend(this.difficultyDisplay);
        }
        
        this.game = new GameState();
        this.startTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false; // 计时器状态标志
        this.timeCounter.textContent = '用时: 00:00'; // 初始显示00:00
    this.initEventListeners();
    this.render();
    this.updateDifficultyDisplay();
    this.loadBestScores();
    
    // 窗口大小变化时重新渲染
    window.addEventListener('resize', () => {
        this.render();
    });
    }

    initTimer() {
        this.startTime = new Date();
        this.timerInterval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - this.startTime) / 1000);
            const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
            const seconds = (diff % 60).toString().padStart(2, '0');
            this.timeCounter.textContent = `用时: ${minutes}:${seconds}`;
        }, 1000);
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.startTime = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.timeCounter.textContent = '用时: 00:00';
    }

    updateDifficultyDisplay() {
        // 更新难度显示为当前棋盘尺寸
        this.difficultyDisplay.textContent = `当前难度：${this.game.size}x${this.game.size}`;
        // 同时更新棋盘下方的尺寸显示
        const difficultyDisplay = document.querySelector('.difficulty-display');
        if (difficultyDisplay) {
            difficultyDisplay.textContent = `${this.game.size}x${this.game.size}`;
        }
    }

    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                e.preventDefault(); // 阻止默认的页面滚动行为
                this.handleMove(e.key);
            }
        });

        // 触摸事件
        let touchStartX, touchStartY;
        this.board.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止触摸时的默认行为
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        this.board.addEventListener('touchend', (e) => {
            e.preventDefault(); // 防止触摸结束时的默认行为
            if (!touchStartX || !touchStartY) return;
            
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            
            // 增加最小滑动距离阈值，避免误触
            const minSwipeDistance = 30;
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;
            
            const direction = Math.abs(deltaX) > Math.abs(deltaY) 
                ? deltaX > 0 ? 'ArrowRight' : 'ArrowLeft'
                : deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
            this.handleMove(direction);
        });

        // 按钮事件
        document.getElementById('newBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('increase-difficulty').addEventListener('click', () => this.changeSize(1));
        document.getElementById('decrease-difficulty').addEventListener('click', () => this.changeSize(-1));
    }

    handleMove(direction) {
        if (this.game.move(direction)) {
            // 如果计时器未运行，则启动计时器
            if (!this.isTimerRunning) {
                this.initTimer();
                this.isTimerRunning = true;
            }
            this.render();
        
            // 检查胜利条件
            if (this.game.checkWin()) {
                this.showWinAlert();
            }
        }
    }

    loadBestScores() {
        this.bestScores = JSON.parse(localStorage.getItem('bestScores')) || {};
    }

    saveBestScore(size, moves, time) {
        const key = `${size}x${size}`;
        const currentBest = this.bestScores[key];
        
        if (!currentBest || moves < currentBest.moves) {
            this.bestScores[key] = { moves, time };
            localStorage.setItem('bestScores', JSON.stringify(this.bestScores));
            return true;
        }
        return false;
    }

    showWinAlert() {
        this.board.classList.add('win');
        clearInterval(this.timerInterval);
        this.isTimerRunning = false; // 重置计时器状态
        
        const time = this.timeCounter.textContent.replace('用时: ', '');
        const isNewRecord = this.saveBestScore(this.game.size, this.game.moves, time);
        
        const winMsg = document.getElementById('winMsg');
        winMsg.textContent = `🎉 恭喜！你用了 ${this.game.moves} 步，耗时 ${time} 完成了 ${this.game.size}x${this.game.size} 的谜题！${isNewRecord ? '\n🏆 新纪录！' : ''}`;
        winMsg.style.display = 'block';
        
        setTimeout(() => {
            this.board.classList.remove('win');
        }, 500);
    }

    render() {
        // 响应式棋盘大小计算
        const containerWidth = Math.min(400, window.innerWidth - 40);
        const tileSize = Math.floor((containerWidth - (this.game.size + 1) * 5) / this.game.size);
        
        this.board.style.gridTemplateColumns = `repeat(${this.game.size}, ${tileSize}px)`;
        this.board.innerHTML = this.game.tiles.map(num => `
            <div class="puzzle-tile ${num === 0 ? 'empty' : ''}" style="width: ${tileSize}px; height: ${tileSize}px; font-size: ${Math.max(14, tileSize * 0.35)}px;">
                ${num === 0 ? '' : num}
            </div>
        `).join('');
        this.moveCounter.textContent = `移动次数: ${this.game.moves}`;
    }

    reset() {
    // 恢复操作输入
    this.board.style.pointerEvents = 'auto';
    // 恢复到当前游戏的初始状态
    this.game.reset();
    this.render();
    this.resetTimer();
}

    changeSize(delta) {
        const newSize = this.game.size + delta;
        if (newSize < 3 || newSize > 6) return; // 扩展到6x6
        this.isSolving = false; // 停止任何可能的AI解题
        this.game = new GameState(newSize);
        this.render();
        this.resetTimer(); // 重置计时器
        this.moveCounter.textContent = `移动次数: 0`;
        const winMsg = document.getElementById('winMsg');
        if (winMsg) winMsg.style.display = 'none';
        // 动态禁用按钮
        document.getElementById('increase-difficulty').disabled = (newSize === 6); // 更新最大值为6
        document.getElementById('decrease-difficulty').disabled = (newSize === 3);
        this.updateDifficultyDisplay();
    }

newGame() {
    this.game = new GameState(this.game.size);
    this.render();
    this.resetTimer();
    this.moveCounter.textContent = `移动次数: 0`;
    const winMsg = document.getElementById('winMsg');
    if (winMsg) winMsg.style.display = 'none';
}

}

// 初始化并暴露到全局作用域供solver使用
window.gameUI = new GameUI();