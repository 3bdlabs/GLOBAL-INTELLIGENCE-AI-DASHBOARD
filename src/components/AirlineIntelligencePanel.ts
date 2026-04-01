import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { fetchFlightDelays, type AirportDelayAlert, type FlightDelaySeverity, type AirportRegion } from '@/services/aviation';
import { escapeHtml } from '@/utils/sanitize';

const SEVERITY_COLOR: Record<FlightDelaySeverity, string> = {
    normal: '#44ff88',
    minor: '#ffcc00',
    moderate: '#ff9900',
    major: '#ff4444',
    severe: '#cc0000',
};

const SEVERITY_LABEL: Record<FlightDelaySeverity, string> = {
    normal: 'NORMAL',
    minor: 'MINOR',
    moderate: 'MOD',
    major: 'MAJOR',
    severe: 'SEVERE',
};

const DELAY_TYPE_ICON: Record<string, string> = {
    ground_stop: '🛑',
    ground_delay: '⏳',
    departure_delay: '🛫',
    arrival_delay: '🛬',
    closure: '🚫',
    general: '✈️',
};

const REGION_LABEL: Record<AirportRegion, string> = {
    americas: '🌎 Americas',
    europe: '🌍 Europe',
    apac: '🌏 Asia-Pacific',
    mena: '🕌 MENA',
    africa: '🌍 Africa',
};

export class AirlineIntelligencePanel extends Panel {
    private alerts: AirportDelayAlert[] = [];
    private loading = false;
    private lastFetch = 0;
    private activeRegion: AirportRegion | 'all' = 'all';
    private readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

    constructor() {
        super({
            id: 'airline-intelligence',
            title: '✈️ ' + t('panels.airlineIntelligence'),
            showCount: true,
            infoTooltip: 'Live airport disruption alerts — delays, ground stops, and closures from FAA and Eurocontrol. Updates every 15 minutes.',
        });
    }

    public async refresh(): Promise<void> {
        if (this.loading) return;
        if (Date.now() - this.lastFetch < this.REFRESH_INTERVAL && this.alerts.length > 0) return;

        this.loading = true;
        this.renderLoading();

        try {
            const raw = await fetchFlightDelays();
            // Filter out "normal" severity unless nothing else available
            const disrupted = raw.filter(a => a.severity !== 'normal');
            this.alerts = disrupted.length > 0 ? disrupted : raw;
            this.lastFetch = Date.now();
            this.setCount(this.alerts.length);
            this.renderAlerts();
        } catch (err) {
            console.error('[AirlineIntelligencePanel]', err);
            this.showError('Aviation data temporarily unavailable');
        } finally {
            this.loading = false;
        }
    }

    private renderLoading(): void {
        this.setContent(`
      <div class="airline-loading">
        <span style="font-size:2rem">✈️</span>
        <div class="airline-loading-text">Fetching airport disruptions...</div>
      </div>
    `);
    }

    private getFiltered(): AirportDelayAlert[] {
        if (this.activeRegion === 'all') return this.alerts;
        return this.alerts.filter(a => a.region === this.activeRegion);
    }

    private renderAlerts(): void {
        const filtered = this.getFiltered();
        const regions = ['all', ...new Set(this.alerts.map(a => a.region))] as ('all' | AirportRegion)[];

        // Sort: severe → major → moderate → minor → normal, then by delay minutes desc
        const sorted = [...filtered].sort((a, b) => {
            const order: FlightDelaySeverity[] = ['severe', 'major', 'moderate', 'minor', 'normal'];
            const diff = order.indexOf(a.severity) - order.indexOf(b.severity);
            return diff !== 0 ? diff : b.avgDelayMinutes - a.avgDelayMinutes;
        });

        const tabHtml = regions.map(r => `
      <button class="airline-tab ${r === this.activeRegion ? 'active' : ''}" data-region="${r}">
        ${r === 'all' ? '🌐 All' : REGION_LABEL[r as AirportRegion] ?? r}
        <span class="airline-tab-count">${r === 'all' ? this.alerts.length : this.alerts.filter(a => a.region === r).length}</span>
      </button>
    `).join('');

        const alertsHtml = sorted.length === 0
            ? `<div class="airline-empty">✅ No disruptions in this region</div>`
            : sorted.map(alert => {
                const color = SEVERITY_COLOR[alert.severity];
                const icon = DELAY_TYPE_ICON[alert.delayType] ?? '✈️';
                const delay = alert.avgDelayMinutes > 0 ? `+${alert.avgDelayMinutes}min` : '';
                const cancelled = alert.cancelledFlights ? ` · ${alert.cancelledFlights} cancelled` : '';
                const reason = alert.reason ? `<div class="airline-reason">${escapeHtml(alert.reason)}</div>` : '';
                return `
          <div class="airline-alert" style="border-left: 3px solid ${color}">
            <div class="airline-alert-header">
              <span class="airline-icon">${icon}</span>
              <div class="airline-airport">
                <span class="airline-code">${escapeHtml(alert.iata)}</span>
                <span class="airline-name">${escapeHtml(alert.name)}</span>
              </div>
              <span class="airline-severity" style="color:${color}">${SEVERITY_LABEL[alert.severity]}</span>
            </div>
            <div class="airline-meta">
              <span>${escapeHtml(alert.city)}, ${escapeHtml(alert.country)}</span>
              ${delay ? `<span class="airline-delay">${delay}</span>` : ''}
              ${cancelled ? `<span class="airline-cancelled">${cancelled}</span>` : ''}
            </div>
            ${reason}
          </div>
        `;
            }).join('');

        const updatedAt = this.lastFetch > 0
            ? new Date(this.lastFetch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';

        this.setContent(`
      <div class="airline-panel">
        <div class="airline-tabs">${tabHtml}</div>
        <div class="airline-alerts">${alertsHtml}</div>
        <div class="airline-footer">
          <span>Sources: FAA · Eurocontrol</span>
          <span>Updated ${updatedAt}</span>
        </div>
      </div>
    `);

        // Wire tab clicks
        this.element?.querySelectorAll('.airline-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeRegion = (btn as HTMLElement).dataset.region as AirportRegion | 'all';
                this.renderAlerts();
            });
        });
    }
}
