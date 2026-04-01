import { h, render } from 'preact';
import { MasterAnalystPanel } from './MasterAnalystPanel';
import { Panel, type PanelOptions } from './Panel';

export class MasterAnalystPanelWrapper extends Panel {
    constructor() {
        const options: PanelOptions = {
            id: 'master-analyst-panel',
            title: 'Master Analyst',
            className: 'master-analyst-wrapper span-2-col span-2-row'
        };
        super(options);

        this.renderPreact();
    }

    private renderPreact() {
        render(h(MasterAnalystPanel, {}), this.content);
    }

    public override destroy(): void {
        render(null, this.content);
        super.destroy();
    }
}
