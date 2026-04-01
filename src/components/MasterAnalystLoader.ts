import { PanelLayoutManager } from '../app/panel-layout';
import { MasterAnalystPanelWrapper } from './MasterAnalystPanelWrapper';

/**
 * MASTER ANALYST INDEPENDENT LOADER
 * This script performs a safe monkey-patch on PanelLayoutManager
 * to inject the Master Analyst panel into the dashboard grid
 * at runtime, avoiding modifications to the original source files.
 */

const originalCreatePanels = PanelLayoutManager.prototype['createPanels'];

PanelLayoutManager.prototype['createPanels'] = function (this: any) {
    // 1. Run original panel creation
    originalCreatePanels.apply(this);

    console.log('[Master Analyst] Injecting Independent Predictive Module...');

    // 2. Instantiate our new panel
    const masterAnalyst = new MasterAnalystPanelWrapper();

    // 3. Register in context
    this.ctx.panels['master-analyst'] = masterAnalyst;

    // 4. Inject into DOM grid
    const panelsGrid = document.getElementById('panelsGrid');
    if (panelsGrid) {
        const el = masterAnalyst.getElement();
        this.makeDraggable(el, 'master-analyst');

        // Strategy: Insert at the beginning of the grid for high visibility
        if (panelsGrid.firstChild) {
            panelsGrid.insertBefore(el, panelsGrid.firstChild);
        } else {
            panelsGrid.appendChild(el);
        }
    }

    // 5. Ensure it's enabled in settings if not already present
    if (this.ctx.panelSettings) {
        if (!this.ctx.panelSettings['master-analyst']) {
            this.ctx.panelSettings['master-analyst'] = {
                name: 'Master Analyst',
                enabled: true,
                priority: 1
            };
        }
    }
};

console.log('[Master Analyst] Plugin Hook Registered Successfully.');
