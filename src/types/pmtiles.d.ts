declare module 'pmtiles' {
    export class PMTiles {
        constructor(url: string | URL);
        getHeader(): Promise<any>;
        getZxy(z: number, x: number, y: number): Promise<any>;
    }

    export const Protocol: any;
}
