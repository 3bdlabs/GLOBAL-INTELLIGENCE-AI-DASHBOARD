import { Component } from 'preact';

interface IntelligenceState {
    data: {
        trend_correlation?: string;
        seven_day_forecast?: string;
        advisor_strategy?: string;
        confidence_score?: number;
    } | null;
    loading: boolean;
    error: string | null;
}

export class IntelligencePanel extends Component<{}, IntelligenceState> {
    state: IntelligenceState = {
        data: null,
        loading: true,
        error: null,
    };

    componentDidMount() {
        // Restore from cache first
        try {
            const cached = localStorage.getItem('wm:strategic_synthesis');
            if (cached) {
                this.setState({ data: JSON.parse(cached), loading: false });
            }
        } catch (e) {
            console.warn('Failed to restore synthesis from cache:', e);
        }
        this.fetchData();
    }

    async fetchData() {
        this.setState({ loading: true, error: null });

        try {
            // Context is now enriched server-side via the AI Context Bridge.
            // Client sends minimal context or last known headlines if available.
            const response = await fetch('/api/v1/strategic-synthesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contextText: "Real-time context requested via bridge." }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const data = await response.json();

            // Persist to localStorage
            try {
                localStorage.setItem('wm:strategic_synthesis', JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to cache synthesis:', e);
            }

            this.setState({ data, loading: false });
        } catch (err: any) {
            this.setState({ error: err.message || 'Error loading synthesis', loading: false });
        }
    }

    render() {
        const { data, loading, error } = this.state;

        return (
            <div className="panel intelligence-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'rgba(15, 17, 19, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div className="panel-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>👁️‍🗨️</span>
                        <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', color: '#fff', textTransform: 'uppercase' }}>
                            Strategic AI Synthesis
                        </h2>
                    </div>
                    <button onClick={() => this.fetchData()} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px 8px',
                        fontSize: '14px',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center'
                    }} title="Reload Intelligence">
                        ↻
                    </button>
                </div>

                <div className="panel-content" style={{ padding: '20px', overflowY: 'auto', flex: 1, color: '#e0e0e0' }}>
                    {loading && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            opacity: 0.7
                        }}>
                            <div className="intelligence-spinner" style={{
                                width: '30px',
                                height: '30px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderTopColor: '#4ade80',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginBottom: '16px'
                            }}></div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Synchronizing Global Data...</div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            fontSize: '12px'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Connection Failure</div>
                            {error}
                        </div>
                    )}

                    {!loading && !error && data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Risk Meter / Confidence */}
                            <div style={{
                                position: 'relative',
                                padding: '16px',
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.01em' }}>
                                    System Confidence
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: data.confidence_score && data.confidence_score > 70 ? '#4ade80' : '#facc15' }}>
                                    {data.confidence_score}%
                                </div>

                                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${data.confidence_score || 0}%`,
                                        background: data.confidence_score && data.confidence_score > 70 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #eab308, #facc15)',
                                        borderRadius: '2px',
                                        boxShadow: '0 0 10px rgba(74, 222, 128, 0.3)'
                                    }}></div>
                                </div>
                            </div>

                            {/* Trend Correlation */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ color: '#60a5fa', fontSize: '12px' }}>◈</span>
                                    <h3 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trend Correlation</h3>
                                </div>
                                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#d1d1d1', padding: '0 4px' }}>
                                    {data.trend_correlation || 'No clear correlation detected.'}
                                </div>
                            </section>

                            {/* Forecast */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ color: '#f87171', fontSize: '12px' }}>◈</span>
                                    <h3 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>7-Day Strategic Outlook</h3>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    padding: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    borderLeft: '2px solid #f87171'
                                }}>
                                    {data.seven_day_forecast || 'Awaiting enough data for forecast.'}
                                </div>
                            </section>

                            {/* Strategy */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ color: '#c084fc', fontSize: '12px' }}>◈</span>
                                    <h3 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Advisor Directives</h3>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    color: '#60a5fa',
                                    fontStyle: 'italic',
                                    padding: '0 4px'
                                }}>
                                    "{data.advisor_strategy || 'Maintain current posture.'}"
                                </div>
                            </section>

                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .intelligence-panel section {
                        padding-bottom: 8px;
                    }
                `}} />
            </div>
        );
    }
}
