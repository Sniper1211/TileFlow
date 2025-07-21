// debug-analytics.js - 开发调试用的分析工具
class AnalyticsDebugger {
    constructor() {
        this.isVisible = false;
        this.createDebugPanel();
        this.bindKeyboardShortcut();
    }
    
    createDebugPanel() {
        // 创建调试面板
        this.panel = document.createElement('div');
        this.panel.id = 'analytics-debug-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        this.panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>📊 Analytics Debug</strong>
                <button onclick="analyticsDebugger.toggle()" style="background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
            </div>
            <div id="debug-stats" style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;"></div>
            <div style="margin-bottom: 8px;">
                <strong>Recent Events:</strong>
                <button onclick="analyticsDebugger.clearData()" style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; margin-left: 10px; font-size: 10px;">Clear</button>
            </div>
            <div id="debug-events" style="max-height: 200px; overflow-y: auto;"></div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #666; font-size: 10px;">
                Press <kbd>Ctrl+Shift+A</kbd> to toggle
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // 定期更新数据
        setInterval(() => {
            if (this.isVisible) {
                this.updatePanel();
            }
        }, 2000);
    }
    
    bindKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible) {
            this.updatePanel();
        }
    }
    
    updatePanel() {
        const data = JSON.parse(localStorage.getItem('gameAnalyticsData') || '[]');
        
        // 更新统计信息
        const stats = this.calculateQuickStats(data);
        document.getElementById('debug-stats').innerHTML = `
            Sessions: ${stats.sessions} | Games: ${stats.games} | Completed: ${stats.completed}
        `;
        
        // 更新事件列表
        const recentEvents = data.slice(-10).reverse();
        document.getElementById('debug-events').innerHTML = recentEvents.map(event => {
            const time = new Date(event.timestamp).toLocaleTimeString();
            return `<div style="margin: 2px 0; padding: 2px; background: rgba(255,255,255,0.05);">
                ${time} - <span style="color: #4CAF50;">${event.event}</span>
                ${event.difficulty ? `<span style="color: #FFC107;">(${event.difficulty})</span>` : ''}
            </div>`;
        }).join('');
    }
    
    calculateQuickStats(data) {
        const sessions = new Set();
        let games = 0;
        let completed = 0;
        
        data.forEach(event => {
            sessions.add(event.sessionId);
            if (event.event === 'game_start') games++;
            if (event.event === 'game_complete') completed++;
        });
        
        return { sessions: sessions.size, games, completed };
    }
    
    clearData() {
        if (confirm('确定要清除所有分析数据吗？')) {
            localStorage.removeItem('gameAnalyticsData');
            this.updatePanel();
        }
    }
}

// 初始化调试器
window.analyticsDebugger = new AnalyticsDebugger();