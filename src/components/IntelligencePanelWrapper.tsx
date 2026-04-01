import { h, render } from 'preact';
import { IntelligencePanel } from './IntelligencePanel';
import { Panel, type PanelOptions } from './Panel';


export class IntelligencePanelWrapper extends Panel {
    constructor() {
        const options: PanelOptions = {
            id: 'intelligence-panel',
            title: 'Strategic Advisory',
            className: 'intelligence-wrapper span-2-col span-2-row'
        };
        super(options);

        // Initial Render
        this.renderPreact();
    }

    private renderPreact() {
        render(h(IntelligencePanel, {}), this.content);
    }

    public override destroy(): void {
        render(null, this.content); // Unmount preact
        super.destroy(); // Call Panel cleanup
    }
}
