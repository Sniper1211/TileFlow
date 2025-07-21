// api/analytics.js - Vercel Serverless Function
export default async function handler(req, res) {
    // 只接受POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const data = req.body;
        
        // 基本数据验证
        if (!data.events || !Array.isArray(data.events)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        
        // 这里你可以将数据发送到你选择的分析服务
        // 例如：Google Analytics, Mixpanel, 自建数据库等
        
        // 示例：记录到控制台（生产环境中应该发送到数据库）
        console.log('Analytics Data:', {
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            eventsCount: data.events.length,
            events: data.events.map(e => ({
                event: e.event,
                timestamp: e.timestamp,
                properties: e
            }))
        });
        
        // 可选：发送到外部分析服务
        // await sendToAnalyticsService(data);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Analytics data received',
            eventsProcessed: data.events.length 
        });
        
    } catch (error) {
        console.error('Analytics API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// 可选：发送到外部分析服务的函数
async function sendToAnalyticsService(data) {
    // 示例：发送到Google Analytics 4
    // const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
    // const GA_API_SECRET = process.env.GA_API_SECRET;
    
    // if (GA_MEASUREMENT_ID && GA_API_SECRET) {
    //     const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
    //         method: 'POST',
    //         body: JSON.stringify({
    //             client_id: data.sessionId,
    //             events: data.events.map(event => ({
    //                 name: event.event,
    //                 params: event
    //             }))
    //         })
    //     });
    // }
}