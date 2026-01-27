
interface Variant {
    id: string;
    traffic_split: number;
    [key: string]: any;
}

export type ABTestEventType = 'impression' | 'click' | 'conversion';

export class ABTestManager {
    private static STORAGE_KEY = 'fliphats_ab_test_assignments';

    static assignVariant(testId: string, variants: Variant[]): Variant {
        if (!variants || variants.length === 0) return { id: 'control', traffic_split: 100 };

        // Check if user already has assignment
        const existing = this.getAssignment(testId);
        if (existing) {
            const found = variants.find(v => v.id === existing);
            if (found) return found;
        }

        // Weighted random assignment
        const totalWeight = variants.reduce((sum, v) => sum + v.traffic_split, 0);
        let random = Math.random() * totalWeight;

        for (const variant of variants) {
            if (random < variant.traffic_split) {
                this.saveAssignment(testId, variant.id);
                return variant;
            }
            random -= variant.traffic_split;
        }

        return variants[0]; // Fallback
    }

    static trackEvent(
        pageId: string,
        testId: string,
        variantId: string,
        eventType: ABTestEventType
    ) {
        // Basic deduplication for impressions
        if (eventType === 'impression') {
            const key = `ab_impression_${testId}`;
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, 'true');
        }

        fetch('/api/track-ab-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId, testId, variantId, eventType }),
        }).catch(err => console.error('Tracking failed', err));
    }

    private static getAssignment(testId: string): string | null {
        if (typeof window === 'undefined') return null;
        try {
            const assignments = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            return assignments[testId] || null;
        } catch {
            return null;
        }
    }

    private static saveAssignment(testId: string, variantId: string) {
        if (typeof window === 'undefined') return;
        try {
            const assignments = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            assignments[testId] = variantId;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assignments));
        } catch {
            // ignore
        }
    }
}
