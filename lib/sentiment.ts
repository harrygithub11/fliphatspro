export type Sentiment = 'positive' | 'negative' | 'neutral';

export function analyzeSentiment(text: string): Sentiment {
    if (!text) return 'neutral';

    const lower = text.toLowerCase();

    // Simple Keyword Dictionaries
    const positiveWords = [
        'interested', 'happy', 'good', 'great', 'love', 'excellent', 'excited',
        'deal', 'bought', 'paid', 'success', 'promising', 'agreed', 'wonderful',
        'thanks', 'thank', 'perfect', 'glad'
    ];

    const negativeWords = [
        'angry', 'upset', 'bad', 'poor', 'hate', 'refund', 'cancel', 'complaint',
        'annoyed', 'slow', 'rude', 'broken', 'issue', 'problem', 'fail', 'disappointed',
        'wrong', 'error'
    ];

    let score = 0;

    positiveWords.forEach(word => {
        if (lower.includes(word)) score++;
    });

    negativeWords.forEach(word => {
        if (lower.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
}

export function getSentimentColor(sentiment: Sentiment): string {
    switch (sentiment) {
        case 'positive': return 'bg-green-100 text-green-700 border-green-200';
        case 'negative': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

export function getSentimentEmoji(sentiment: Sentiment): string {
    switch (sentiment) {
        case 'positive': return '😊';
        case 'negative': return '😡';
        default: return '😐';
    }
}
