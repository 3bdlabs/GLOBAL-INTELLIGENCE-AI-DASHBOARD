
export class AnalyticsManager {
    private globalBuffer: string[] = [];
    private readonly maxBufferSize = 50;

    // Collect text summaries from categories into the buffer
    public ingestSummary(summary: string) {
        if (!summary || summary.trim().length === 0) return;

        this.globalBuffer.push(summary);

        // Maintain a rolling window of maxBufferSize
        if (this.globalBuffer.length > this.maxBufferSize) {
            this.globalBuffer.shift();
        }
    }

    public getBuffer(): string[] {
        return [...this.globalBuffer];
    }

    public clearBuffer() {
        this.globalBuffer = [];
    }
}

export const analyticsManager = new AnalyticsManager();
