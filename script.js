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
        this.shuffle(150 + Math.floor(Math.random() * 150));
        this.history = [...this.tiles]; // 保存初始状态用于重置
    }

    shuffle(steps) {
        // 已完成状态
        this.tiles = [...Array(this.size * this.size - 1).keys()].map(i => i + 1).concat(0);
        this.emptyIndex = this.size * this.size - 1;

        // 随机“反向”移动空格
        const dirs = [-1, 1, -this.size, this.size]; // 左、右、上、下
        for (let i = 0; i < steps; i++) {
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
        this.initTimer();
        this.initEventListeners();
        this.render();
        this.updateDifficultyDisplay();
        this.loadBestScores();
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
        this.initTimer();
    }

    updateDifficultyDisplay() {
        this.difficultyDisplay.textContent = `当前难度：${this.game.size}x${this.game.size}`;
    }

    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                this.handleMove(e.key);
            }
        });

        // 触摸事件
        let touchStartX, touchStartY;
        this.board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        this.board.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
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
            this.render();
            
            // 延迟胜利判定（等待动画完成）
            setTimeout(() => {
                if (this.game.checkWin()) {
                    this.showWinAlert();
                }
            }, 300); // 匹配CSS过渡时长
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
        this.board.style.gridTemplateColumns = `repeat(${this.game.size}, 80px)`;
        this.board.innerHTML = this.game.tiles.map(num => `
            <div class="puzzle-tile ${num === 0 ? 'empty' : ''}">
                ${num === 0 ? '' : num}
            </div>
        `).join('');
        this.moveCounter.textContent = `移动次数: ${this.game.moves}`;
    }

    reset() {
        // 恢复操作输入
        document.addEventListener('keydown', this.boundKeyHandler);
        this.board.style.pointerEvents = 'auto';
        // 重新初始化游戏
        this.game = new GameState(this.game.size);
        this.render();
        this.resetTimer();
    }

    changeSize(delta) {
        const newSize = this.game.size + delta;
        if (newSize < 3 || newSize > 4) return;
        this.game = new GameState(newSize);
        this.render();
        // 新增：动态禁用按钮
        document.getElementById('increase-difficulty').disabled = (newSize === 4);
        document.getElementById('decrease-difficulty').disabled = (newSize === 3);
        this.updateDifficultyDisplay(); // 添加更新显示
    }
}

// 初始化
new GameUI();