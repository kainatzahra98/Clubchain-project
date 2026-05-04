const axios = require('axios');

const analyzeSentiment = async (text) => {
    try {
        const lowerText = text.toLowerCase();

        // 1. Pre-analysis: Rule-based check for high-confidence keywords
        const positiveKeywords = ['excellent', 'amazing', 'perfect', 'superb', 'outstanding', 'brilliant', 'great', 'love', 'best', 'wonderful', 'professional', 'awesome', 'good', 'nice', 'wow', 'satisfied', 'thanks', 'thank you', 'pleased', 'impressed', 'clean', 'helpful', 'friendly'];
        const negativeKeywords = ['terrible', 'worst', 'awful', 'horrible', 'poor', 'bad', 'broken', 'disappointed', 'waste', 'useless', 'slow', 'crash', 'bugs', 'errors', 'failing', 'annoying', 'hate', 'sucks', 'rude', 'dirty', 'expensive'];

        const hasPositive = positiveKeywords.some(word => lowerText.includes(word));
        const hasNegative = negativeKeywords.some(word => lowerText.includes(word));

        // If it's clearly one-sided and strong, we can use it or use it to bias the AI
        let localSentiment = null;
        if (hasPositive && !hasNegative) localSentiment = 'positive';
        if (hasNegative && !hasPositive) localSentiment = 'negative';

        const url = process.env.SENTIMENT_SERVICE_URL;
        console.log(`[AI] SENTIMENT_SERVICE_URL exists:`, !!url);
        console.log(`[AI] SENTIMENT_SERVICE_URL value:`, url);
        console.log(`[AI] Analyzing: "${text.substring(0, 30)}..." at ${url}`);
        
        let sentiment = 'neutral';
        let confidence = 0.5;

        if (!url) {
            console.error('[AI] SENTIMENT_SERVICE_URL not configured, using local rules');
            if (localSentiment) {
                return { sentiment: localSentiment, confidence: 0.8, isFallback: true };
            }
            return { sentiment: 'neutral', confidence: 0.5, isFallback: true };
        }

        try {
            const response = await axios.post(url, { feedback: text });
            console.log(`[AI] Response:`, response.data);
            sentiment = (response.data.sentiment || 'neutral').toLowerCase();
            confidence = response.data.confidence || 0.9;
        } catch (apiError) {
            console.warn('[AI] External service failed:', apiError.message);
            console.warn('[AI] Using local rules');
            if (localSentiment) {
                return { sentiment: localSentiment, confidence: 0.8, isFallback: true };
            }
        }

        // 2. Logic refinement: If AI says neutral but local rules are strongly positive/negative
        if (sentiment === 'neutral' && localSentiment) {
            console.log(`[AI] Overriding neutral with local: ${localSentiment}`);
            return {
                sentiment: localSentiment,
                confidence: 0.85,
                isFallback: false
            };
        }

        return {
            sentiment,
            confidence,
            isFallback: false
        };
    } catch (error) {
        console.error('Sentiment Service Error:', error.message);
        return {
            sentiment: 'neutral',
            confidence: 0,
            isFallback: true
        };
    }
};

module.exports = { analyzeSentiment };
