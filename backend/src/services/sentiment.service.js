const axios = require('axios');

const analyzeSentiment = async (text) => {
    try {
        const url = process.env.SENTIMENT_SERVICE_URL || 'http://localhost:8000/predict';
        console.log(`[AI] Analyzing: "${text.substring(0, 30)}..." at ${url}`);
        const response = await axios.post(url, { feedback: text });
        console.log(`[AI] Response:`, response.data);

        return {
            sentiment: (response.data.sentiment || 'neutral').toLowerCase(),
            confidence: response.data.confidence || 0.9,
            isFallback: false
        };
    } catch (error) {
        console.error('Sentiment Service Error:', error.message);
        // Fallback if service is down
        return {
            sentiment: 'neutral',
            confidence: 0,
            isFallback: true
        };
    }
};

module.exports = { analyzeSentiment };
