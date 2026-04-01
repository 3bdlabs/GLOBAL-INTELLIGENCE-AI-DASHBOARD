import { Component } from 'preact';

interface MasterAnalystState {
    data: {
        trend_correlation?: string;
        seven_day_forecast?: string;
        advisor_strategy?: string;
        confidence_score?: number;
    } | null;
    loading: boolean;
    error: string | null;
}

export class MasterAnalystPanel extends Component<{}, MasterAnalystState> {
    state: MasterAnalystState = {
        data: null,
        loading: true,
        error: null,
    };

    componentDidMount() {
        this.fetchData();
        // Visual refresh every 30 minutes
        setInterval(() => this.fetchData(), 1800000);
    }

    async fetchData() {
        this.setState({ loading: true, error: null });
        try {
            // Mock buffer text for synthesis if none provided
            const mockContext = "Global supply chains face disruption. Stability in energy markets remains uncertain. Border security concerns are rising in Eastern Europe and the South China Sea.";

            const response = await fetch('/api/v1/strategic-synthesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contextText: mockContext }),
            });

            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            const data = await response.json();
            this.setState({ data, loading: false });
        } catch (err: any) {
            this.setState({ error: err.message || 'Data Acquisition Failure', loading: false });
        }
    }

    render() {
        const { data, loading, error } = this.state;

        return (
            <div className="panel master-analyst-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.98) 0%, rgba(10, 10, 15, 0.99) 100%)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(0, 150, 255, 0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 150, 255, 0.05)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 150, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 5px #0096ff)' }}>🔮</span>
                        <h2 style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            color: '#00ccff',
                            textTransform: 'uppercase'
                        }}>
                            Master Analyst Predictive Layer
                        </h2>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        REAL-TIME GEOPOLITICAL SYNTHESIS
                    </div>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#0096ff' }}>
                            <div className="pulse-loader"></div>
                            <div style={{ marginTop: '15px', fontSize: '13px', letterSpacing: '0.05em' }}>QUANTUM CORRELATION IN PROGRESS...</div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '15px',
                            borderRadius: '6px',
                            background: 'rgba(255, 50, 50, 0.1)',
                            border: '1px solid rgba(255, 50, 50, 0.3)',
                            color: '#ff6b6b',
                            fontSize: '12px'
                        }}>
                            <strong>ANALYSIS INTERRUPTED:</strong> {error}
                        </div>
                    )}

                    {!loading && !error && data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Risk Meter */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase' }}>Global Instability Index</div>
                                <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        border: '8px solid rgba(255,255,255,0.05)',
                                        borderTopColor: (data.confidence_score || 0) > 70 ? '#00ff88' : '#ffcc00',
                                        borderRadius: '50%',
                                        transform: `rotate(${(data.confidence_score || 0) * 1.8}deg)`,
                                        transition: 'transform 1s ease-out',
                                        boxShadow: `0 0 20px ${(data.confidence_score || 0) > 70 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 204, 0, 0.2)'}`
                                    }}></div>
                                    <div style={{ position: 'absolute', fontSize: '28px', fontWeight: 800, color: '#fff' }}>
                                        {data.confidence_score}%
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', marginTop: '10px', color: '#00ccff' }}>CONFIDENCE RATING: {(data.confidence_score || 0) > 80 ? 'HIGH' : 'ELEVATED'}</div>
                            </div>

                            {/* Synthesis Area */}
                            <section>
                                <h3 style={{ fontSize: '12px', color: '#0096ff', marginBottom: '8px', borderLeft: '3px solid #0096ff', paddingLeft: '8px' }}>CROSS-CATEGORY CORRELATIONS</h3>
                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                    {data.trend_correlation}
                                </div>
                            </section>

                            {/* Forecast Area */}
                            <section>
                                <h3 style={{ fontSize: '12px', color: '#ffcc00', marginBottom: '8px', borderLeft: '3px solid #ffcc00', paddingLeft: '8px' }}>7-DAY STRATEGIC OUTLOOK</h3>
                                <div style={{ position: 'relative', marginTop: '12px' }}>
                                    <div style={{
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        color: '#fff',
                                        fontStyle: 'italic',
                                        padding: '12px',
                                        border: '1px solid rgba(255, 204, 0, 0.2)',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 204, 0, 0.05)'
                                    }}>
                                        "{data.seven_day_forecast}"
                                    </div>
                                    {/* Timeline Marker */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ height: '6px', width: '2px', background: day > 3 ? '#ff3333' : '#00ff88' }}></div>
                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>D{day}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, #00ff88, #ffcc00, #ff3333)', opacity: 0.3, marginTop: '-18px' }}></div>
                                </div>
                            </section>

                            {/* Advisor Strategy */}
                            <section>
                                <h3 style={{ fontSize: '12px', color: '#ff3333', marginBottom: '8px', borderLeft: '3px solid #ff3333', paddingLeft: '8px' }}>DIRECTIVES</h3>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', padding: '0 8px' }}>
                                    {data.advisor_strategy}
                                </div>
                            </section>

                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .pulse-loader {
                        width: 40px;
                        height: 40px;
                        margin: 0 auto;
                        background-color: #0096ff;
                        border-radius: 100%;
                        animation: pulse 1s infinite ease-in-out;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 0; }
                    }
                    .master-analyst-panel::-webkit-scrollbar {
                        width: 6px;
                    }
                    .master-analyst-panel::-webkit-scrollbar-thumb {
                        background: rgba(0, 150, 255, 0.2);
                        border-radius: 3px;
                    }
                `}} />
            </div>
        );
    }
}
