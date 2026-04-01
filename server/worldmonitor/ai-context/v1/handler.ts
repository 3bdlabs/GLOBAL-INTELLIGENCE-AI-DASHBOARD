import type { ServerContext } from '../../../../src/generated/server/worldmonitor/news/v1/service_server';
import { listFeedDigest } from '../../news/v1/list-feed-digest';
import { getCableHealth } from '../../infrastructure/v1/get-cable-health';
import { getChokepointStatus } from '../../supply-chain/v1/get-chokepoint-status';

export interface AiContextState {
    regionalNews: Record<string, string[]>;
    infrastructure: {
        cablesDegraded: number;
        chokepointsCongested: number;
    };
    timestamp: string;
}

export async function getAiContext(_ctx: ServerContext): Promise<AiContextState> {
    const [news, cables, chokepoints] = await Promise.all([
        listFeedDigest(_ctx, { variant: 'full', lang: 'en' }),
        getCableHealth(_ctx, {}),
        getChokepointStatus(_ctx, {}),
    ]);

    const regionalNews: Record<string, string[]> = {};
    for (const [category, bucket] of Object.entries(news.categories)) {
        regionalNews[category] = bucket.items.slice(0, 3).map(item => item.title);
    }

    const cablesDegraded = Object.values(cables.cables).filter(
        c => c.status !== 'CABLE_HEALTH_STATUS_OK'
    ).length;

    const chokepointsCongested = chokepoints.chokepoints.filter(
        cp => cp.congestionLevel !== 'normal'
    ).length;

    return {
        regionalNews,
        infrastructure: {
            cablesDegraded,
            chokepointsCongested,
        },
        timestamp: new Date().toISOString(),
    };
}
