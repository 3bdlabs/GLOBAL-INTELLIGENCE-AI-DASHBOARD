# Fixing Commodity Sparklines

## Objective
The primary goal was to restore the missing mini sparkline graphs for the Commodities panel (VIX, GOLD, OIL, NATGAS) on the dashboard. The absence of the graphs was due to Yahoo Finance rate-limiting the local container IP and returning 429 errors. 

## Approach & Fixes
To resolve this complex issue, multiple interconnected layers needed to be fixed:

1. **Upstash Redis Caching Added**
   - Implemented Upstash Redis using the provided credentials (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
   - Extended the caching TTL for commodity quotes to 2 hours to ensure data survives temporary rate-limit windows enforced by Yahoo Finance.

2. **Refactored Yahoo Data Proxying (The Relay)**
   - Created a new `fetchYahooQuoteCommodity` strategy that prioritizes fetching from our external Relay Server, which has a different IP footprint and avoids strict local rate limits.

3. **Restored Historical Data Intervals (The Core Sparkline Bug)**
   - Upon investigating the raw JSON responses reaching the frontend, we discovered they contained a `sparkline` array with exactly **1 data point**. The frontend's SVG sparkline component rightfully requires at least **2 data points** to draw a line. 
   - We updated the backend (`server/worldmonitor/market/v1/_shared.ts`) to explicitly pass `?range=1d&interval=15m` to both the direct Yahoo charts and the Relay proxy to ensure it collects enough historical granularity to draw the trend line. 

4. **Synchronized Frontend & Backend Caching Keys**
   - We discovered the dashboard frontend uses the `listMarketQuotes` RPC (not `listCommodityQuotes` directly) heavily, caching under the `market:quotes:v1` Redis namespace. 
   - We purged this namespace using a custom admin script to kickstart the system, allowing the new 15m interval data to propagate fully to the client.

## Verification
A browser subagent verified the live dashboard. The sparklines for VIX, GOLD, OIL, and NATGAS are now restored and accurately track the day's trend!

### Evidence
![Restored Commodities Panel with Sparklines](file:///C:/Users/USER/.gemini/antigravity/brain/4e1168a2-212e-400e-b1af-bbedb4ea849a/commodities_panel_sparklines_verified_1773209264299.png)
