// api/stats.js - 获取统计数据的API端点
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // 这里应该从你的数据库或存储服务获取数据
        // 现在我们返回模拟数据作为示例
        
        const mockStats = {
            totalSessions: 156,
            totalGames: 423,
            completedGames: 287,
            averageMoves: 45,
            averageTime: '02:34',
            popularDifficulty: '3x3',
            aiUsageCount: 89,
            dailyStats: [
                { date: '2025-01-20', games: 23, completed: 18 },
                { date: '2025-01-21', games: 31, completed: 24 },
                { date: '2025-01-22', games: 28, completed: 19 }
            ],
            difficultyBreakdown: {
                '3x3': 245,
                '4x4': 132,
                '5x5': 46
            },
            recentEvents: [
                { event: 'game_complete', difficulty: '3x3', moves: 42, timestamp: Date.now() - 300000 },
                { event: 'game_start', difficulty: '4x4', timestamp: Date.now() - 600000 },
                { event: 'ai_solve_used', difficulty: '3x3', timestamp: Date.now() - 900000 }
            ]
        };
        
        // 添加CORS头部
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(200).json({
            success: true,
            data: mockStats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Stats API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}