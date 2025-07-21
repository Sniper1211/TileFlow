// analytics.js - 数据统计配置
class GameAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.isEnabled = true;
        
        // 检查用户是否同意数据收集
        this.checkConsent();
        
        // 页面加载统计
        this.trackPageView();
        
        // 监听页面离开事件
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    checkConsent() {
        // 简单的cookie同意检查
        const consent = localStorage.getItem('analytics_consent');
        if (consent === null) {
            // 可以在这里显示cookie同意弹窗
            this.isEnabled = true; // 默认启用，你可以根据需要修改
            localStorage.setItem('analytics_consent', 'true');
        } else {
            this.isEnabled = consent === 'true';
        }
    }
    
    track(eventName, properties = {}) {
        if (!this.isEnabled) return;
        
        const event = {
            event: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...properties
        };
        
        this.events.push(event);
        
        // 开发环境下在控制台显示事件
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
            console.log('📊 Analytics Event:', eventName, properties);
        }
        
        // 保存到本地存储以便查看（开发/测试用）
        this.saveToLocalStorage(event);
        
        // 发送到Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter_1: JSON.stringify(properties),
                session_id: this.sessionId
            });
        }
        
        // 批量发送到自定义端点（可选）
        if (this.events.length >= 10) {
            this.sendBatch();
        }
    }
    
    saveToLocalStorage(event) {
        try {
            const existingData = JSON.parse(localStorage.getItem('gameAnalyticsData') || '[]');
            existingData.push(event);
            
            // 只保留最近1000个事件，避免存储过多
            if (existingData.length > 1000) {
                existingData.splice(0, existingData.length - 1000);
            }
            
            localStorage.setItem('gameAnalyticsData', JSON.stringify(existingData));
        } catch (error) {
            console.log('Failed to save analytics to localStorage:', error);
        }
    }
    
    // 游戏相关事件跟踪
    trackGameStart(difficulty) {
        this.track('game_start', {
            difficulty: difficulty,
            timestamp: Date.now()
        });
    }
    
    trackGameComplete(difficulty, moves, time, isNewRecord) {
        this.track('game_complete', {
            difficulty: difficulty,
            moves: moves,
            time: time,
            is_new_record: isNewRecord,
            completion_rate: 1
        });
    }
    
    trackGameReset(difficulty, moves, time) {
        this.track('game_reset', {
            difficulty: difficulty,
            moves_before_reset: moves,
            time_before_reset: time,
            completion_rate: 0
        });
    }
    
    trackAISolve(difficulty) {
        this.track('ai_solve_used', {
            difficulty: difficulty
        });
    }
    
    trackDifficultyChange(fromDifficulty, toDifficulty) {
        this.track('difficulty_change', {
            from_difficulty: fromDifficulty,
            to_difficulty: toDifficulty
        });
    }
    
    trackPageView() {
        this.track('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });
    }
    
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.startTime;
        this.track('session_end', {
            session_duration: sessionDuration,
            events_count: this.events.length
        });
        
        // 立即发送剩余事件
        this.sendBatch();
    }
    
    sendBatch() {
        if (this.events.length === 0) return;
        
        // 发送到Vercel Analytics API或其他端点
        const data = {
            events: this.events,
            sessionId: this.sessionId,
            timestamp: Date.now()
        };
        
        // 使用navigator.sendBeacon确保数据发送
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', JSON.stringify(data));
        } else {
            // 备用方案
            fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(err => console.log('Analytics send failed:', err));
        }
        
        this.events = [];
    }
}

// 初始化分析
window.gameAnalytics = new GameAnalytics();

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameAnalytics;
}