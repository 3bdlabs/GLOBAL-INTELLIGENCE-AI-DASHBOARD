/**
 * MapContainer - Conditional map renderer
 * Renders DeckGLMap (WebGL) on desktop, fallback to D3/SVG MapComponent on mobile.
 * Supports an optional 3D globe mode (globe.gl) selectable from Settings.
 */
import { isMobileDevice } from '@/utils';
import { MapComponent } from './Map';
import { DeckGLMap, type DeckMapView, type CountryClickPayload } from './DeckGLMap';
import { GlobeMap } from './GlobeMap';
import type {
  MapLayers,
  Hotspot,
  NewsItem,
  InternetOutage,
  RelatedAsset,
  AssetType,
  AisDisruptionEvent,
  AisDensityZone,
  CableAdvisory,
  RepairShip,
  SocialUnrestEvent,
  MilitaryFlight,
  MilitaryVessel,
  MilitaryFlightCluster,
  MilitaryVesselCluster,
  NaturalEvent,
  UcdpGeoEvent,
  CyberThreat,
  CableHealthRecord,
} from '@/types';
import type { AirportDelayAlert, PositionSample } from '@/services/aviation';
import type { DisplacementFlow } from '@/services/displacement';
import type { Earthquake } from '@/services/earthquakes';
import type { ClimateAnomaly } from '@/services/climate';
import type { WeatherAlert } from '@/services/weather';
import type { PositiveGeoEvent } from '@/services/positive-events-geo';
import type { KindnessPoint } from '@/services/kindness-data';
// @ts-ignore
import type { HappinessData } from '@/services/happiness-data';
import type { SpeciesRecovery } from '@/services/conservation-data';
import type { RenewableInstallation } from '@/services/renewable-installations';
import type { GpsJamHex } from '@/services/gps-interference';
import type { SatellitePosition } from '@/services/satellites';
import type { IranEvent } from '@/services/conflict';
import type { ImageryScene } from '@/generated/server/worldmonitor/imagery/v1/service_server';

export type TimeRange = '1h' | '6h' | '24h' | '48h' | '7d' | 'all';
export type MapView = 'global' | 'america' | 'mena' | 'eu' | 'asia' | 'latam' | 'africa' | 'oceania';

export interface MapContainerState {
  zoom: number;
  pan: { x: number; y: number };
  view: MapView;
  layers: MapLayers;
  timeRange: TimeRange;
}

interface TechEventMarker {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  country: string;
  startDate: string;
  endDate: string;
  url: string | null;
  daysUntil: number;
}

type FireMarker = { lat: number; lon: number; brightness: number; frp: number; confidence: number; region: string; acq_date: string; daynight: string };
type NewsLocationMarker = { lat: number; lon: number; title: string; threatLevel: string; timestamp?: Date };
type CIIScore = { code: string; score: number; level: string };

/**
 * Unified map interface that delegates to either DeckGLMap or MapComponent
 * based on device capabilities
 */
export class MapContainer {
  private container: HTMLElement;
  private isMobile: boolean;
  private deckGLMap: DeckGLMap | null = null;
  private globeMap: GlobeMap | null = null;
  private svgMap: MapComponent | null = null;
  private initialState: MapContainerState;
  private useDeckGL: boolean;
  private useGlobe: boolean = false;
  private isResizingInternal = false;
  private resizeObserver: ResizeObserver | null = null;

  // Dual-container subDivs — both exist in DOM from init, toggled via display
  private div2d: HTMLElement | null = null;
  private div3d: HTMLElement | null = null;

  // ─── Callback cache (survives map mode switches) ───────────────────────────
  private cachedOnStateChange: ((state: MapContainerState) => void) | null = null;
  private cachedOnLayerChange: ((layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void) | null = null;
  private cachedOnTimeRangeChanged: ((range: TimeRange) => void) | null = null;
  private cachedOnCountryClicked: ((country: CountryClickPayload) => void) | null = null;
  private cachedOnHotspotClicked: ((hotspot: Hotspot) => void) | null = null;
  private cachedOnAircraftPositionsUpdate: ((positions: PositionSample[]) => void) | null = null;
  private cachedOnSatelliteClick: ((sat: any) => void) | null = null;
  private cachedOnMapContextMenu: ((payload: { lat: number; lon: number; screenX: number; screenY: number }) => void) | null = null;

  // ─── Data cache (survives map mode switches) ───────────────────────────────
  private cachedEarthquakes: Earthquake[] | null = null;
  private cachedWeatherAlerts: WeatherAlert[] | null = null;
  private cachedOutages: InternetOutage[] | null = null;
  private cachedAisDisruptions: AisDisruptionEvent[] | null = null;
  private cachedAisDensity: AisDensityZone[] | null = null;
  private cachedCableAdvisories: CableAdvisory[] | null = null;
  private cachedRepairShips: RepairShip[] | null = null;
  private cachedCableHealth: Record<string, CableHealthRecord> | null = null;
  private cachedProtests: SocialUnrestEvent[] | null = null;
  private cachedFlightDelays: AirportDelayAlert[] | null = null;
  private cachedAircraftPositions: PositionSample[] | null = null;
  private cachedMilitaryFlights: MilitaryFlight[] | null = null;
  private cachedMilitaryFlightClusters: MilitaryFlightCluster[] | null = null;
  private cachedMilitaryVessels: MilitaryVessel[] | null = null;
  private cachedMilitaryVesselClusters: MilitaryVesselCluster[] | null = null;
  private cachedNaturalEvents: NaturalEvent[] | null = null;
  private cachedFires: FireMarker[] | null = null;
  private cachedTechEvents: TechEventMarker[] | null = null;
  private cachedUcdpEvents: UcdpGeoEvent[] | null = null;
  private cachedDisplacementFlows: DisplacementFlow[] | null = null;
  private cachedClimateAnomalies: ClimateAnomaly[] | null = null;
  private cachedGpsJamming: GpsJamHex[] | null = null;
  private cachedSatellites: SatellitePosition[] | null = null;
  private cachedCyberThreats: CyberThreat[] | null = null;
  private cachedIranEvents: IranEvent[] | null = null;
  private cachedNewsLocations: NewsLocationMarker[] | null = null;
  private cachedPositiveEvents: PositiveGeoEvent[] | null = null;
  private cachedKindnessData: KindnessPoint[] | null = null;
  private cachedHappinessScores: HappinessData | null = null;
  private cachedCIIScores: CIIScore[] | null = null;
  private cachedSpeciesRecovery: SpeciesRecovery[] | null = null;
  private cachedRenewableInstallations: RenewableInstallation[] | null = null;
  private cachedHotspotActivity: NewsItem[] | null = null;
  private cachedEscalationFlights: MilitaryFlight[] | null = null;
  private cachedEscalationVessels: MilitaryVessel[] | null = null;
  private cachedImageryScenes: ImageryScene[] | null = null;

  constructor(container: HTMLElement, initialState: MapContainerState, preferGlobe = false) {
    this.container = container;
    this.initialState = initialState;
    this.isMobile = isMobileDevice();
    this.useGlobe = preferGlobe && this.hasWebGLSupport();

    // Use deck.gl on desktop with WebGL support, SVG on mobile
    this.useDeckGL = !this.useGlobe && this.shouldUseDeckGL();

    this.init();
  }

  private hasWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      return !!gl2;
    } catch {
      return false;
    }
  }

  private shouldUseDeckGL(): boolean {
    if (!this.hasWebGLSupport()) return false;
    if (!this.isMobile) return true;
    const mem = (navigator as any).deviceMemory;
    if (mem !== undefined && mem < 3) return false;
    return true;
  }

  private initSvgMap(logMessage: string): void {
    console.log(logMessage);
    this.useDeckGL = false;
    this.deckGLMap = null;
    this.container.classList.remove('deckgl-mode');
    this.container.classList.add('svg-mode');
    this.container.innerHTML = '';
    this.svgMap = new MapComponent(this.container, this.initialState);
  }

  private init(): void {
    if (this.useGlobe) {
      console.log('[MapContainer] Initializing 3D globe (globe.gl mode)');
      this.initDualContainers();
      this.div2d!.style.display = 'none';
      this.div3d!.style.display = 'block';
      this.container.classList.add('globe-mode');
      this.globeMap = new GlobeMap(this.div3d!, this.initialState);
    } else if (this.useDeckGL) {
      console.log('[MapContainer] Initializing deck.gl map (desktop mode)');
      try {
        this.initDualContainers();
        this.div2d!.style.display = 'block';
        this.div3d!.style.display = 'none';
        this.container.classList.add('deckgl-mode');

        this.deckGLMap = new DeckGLMap(this.div2d!, {
          ...this.initialState,
          view: this.initialState.view as DeckMapView,
        });
      } catch (error) {
        console.warn('[MapContainer] DeckGL initialization failed, falling back to SVG map', error);
        this.div2d?.remove();
        this.div3d?.remove();
        this.div2d = null;
        this.div3d = null;
        this.initSvgMap('[MapContainer] Initializing SVG map (DeckGL fallback mode)');
      }
    } else {
      this.initSvgMap('[MapContainer] Initializing SVG map (mobile/fallback mode)');
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.isResizingInternal) return;
        this.resize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  private initDualContainers(): void {
    if (this.div2d && this.div3d) return;
    this.container.innerHTML = '';
    this.div2d = document.createElement('div');
    this.div2d.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    this.div2d.dataset.engineDiv = '2d';

    this.div3d = document.createElement('div');
    this.div3d.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    this.div3d.dataset.engineDiv = '3d';

    this.container.style.position = 'relative';
    this.container.appendChild(this.div2d);
    this.container.appendChild(this.div3d);
  }

  private zoomToAltitude(zoom: number): number {
    return Math.max(0.05, 2.5 * Math.pow(2, 1 - zoom));
  }
  private altitudeToZoom(altitude: number): number {
    return Math.max(1, 1 - Math.log2(altitude / 2.5));
  }

  public switchToGlobe(): void {
    if (this.useGlobe) return;
    if (!this.div2d || !this.div3d) this.initDualContainers();
    console.log('[MapContainer] Switching to Globe.gl');

    const snapshot = this.getState();
    const center = this.getCenter();

    this.div2d!.style.display = 'none';
    this.div3d!.style.display = 'block';
    this.container.classList.remove('deckgl-mode', 'svg-mode');
    this.container.classList.add('globe-mode');

    if (!this.globeMap) {
      this.globeMap = new GlobeMap(this.div3d!, this.initialState);
      this.rehydrateActiveMap();
    }

    if (center) {
      const altitude = this.zoomToAltitude(snapshot.zoom);
      this.globeMap.setCenter(center.lat, center.lon);
      this.globeMap.setZoom(altitude);
    }

    this.useGlobe = true;
    this.useDeckGL = false;
  }

  public switchToFlat(): void {
    if (!this.useGlobe) return;
    if (!this.div2d || !this.div3d) return;
    console.log('[MapContainer] Switching to Deck.gl (Flat)');

    const center = this.globeMap?.getCenter();

    this.div3d!.style.display = 'none';
    this.div2d!.style.display = 'block';
    this.container.classList.remove('globe-mode');
    this.container.classList.add('deckgl-mode');

    if (center && this.deckGLMap) {
      const flatZoom = this.altitudeToZoom(this.initialState.zoom);
      this.deckGLMap.setCenter(center.lat, center.lon, flatZoom);
    }

    this.deckGLMap?.resize();
    this.useGlobe = false;
    this.useDeckGL = this.shouldUseDeckGL();
  }

  public reloadBasemap(): void {
    this.deckGLMap?.reloadBasemap();
  }

  public isGlobeMode(): boolean {
    return this.useGlobe;
  }

  private rehydrateActiveMap(): void {
    const map = this.useGlobe ? this.globeMap : (this.useDeckGL ? this.deckGLMap : this.svgMap);
    if (!map) return;

    if (this.cachedOnStateChange) this.setOnStateChange(this.cachedOnStateChange);
    if (this.cachedOnLayerChange) this.setOnLayerChange(this.cachedOnLayerChange);
    if (this.cachedOnTimeRangeChanged) this.setOnTimeRangeChange(this.cachedOnTimeRangeChanged);
    if (this.cachedOnCountryClicked) this.setOnCountryClick(this.cachedOnCountryClicked);
    if (this.cachedOnHotspotClicked) this.setOnHotspotClick(this.cachedOnHotspotClicked);
    if (this.cachedOnAircraftPositionsUpdate) this.setOnAircraftPositionsUpdate(this.cachedOnAircraftPositionsUpdate);
    if (this.cachedOnMapContextMenu) this.setOnMapContextMenu(this.cachedOnMapContextMenu);
    if (this.cachedOnSatelliteClick) this.setOnSatelliteClick(this.cachedOnSatelliteClick);

    if (this.cachedEarthquakes) map.setEarthquakes(this.cachedEarthquakes);
    if (this.cachedWeatherAlerts) map.setWeatherAlerts(this.cachedWeatherAlerts);
    if (this.cachedOutages) map.setOutages(this.cachedOutages);
    if (this.cachedAisDisruptions && this.cachedAisDensity) map.setAisData(this.cachedAisDisruptions, this.cachedAisDensity);
    if (this.cachedCableAdvisories && this.cachedRepairShips) map.setCableActivity(this.cachedCableAdvisories, this.cachedRepairShips);
    if (this.cachedCableHealth) map.setCableHealth(this.cachedCableHealth);
    if (this.cachedProtests) map.setProtests(this.cachedProtests);
    if (this.cachedFlightDelays) map.setFlightDelays(this.cachedFlightDelays);
    if (this.cachedAircraftPositions) map.setAircraftPositions(this.cachedAircraftPositions);
    if (this.cachedMilitaryFlights) map.setMilitaryFlights(this.cachedMilitaryFlights, this.cachedMilitaryFlightClusters || []);
    if (this.cachedMilitaryVessels) map.setMilitaryVessels(this.cachedMilitaryVessels, this.cachedMilitaryVesselClusters || []);
    if (this.cachedNaturalEvents) map.setNaturalEvents(this.cachedNaturalEvents);
    if (this.cachedFires) map.setFires(this.cachedFires);
    if (this.cachedTechEvents) map.setTechEvents(this.cachedTechEvents);
    if (this.cachedUcdpEvents) map.setUcdpEvents(this.cachedUcdpEvents);
    if (this.cachedDisplacementFlows) map.setDisplacementFlows(this.cachedDisplacementFlows);
    if (this.cachedClimateAnomalies) map.setClimateAnomalies(this.cachedClimateAnomalies);
    if (this.cachedGpsJamming) map.setGpsJamming(this.cachedGpsJamming);
    if (this.cachedSatellites) map.setSatellites(this.cachedSatellites);
    if (this.cachedCyberThreats) map.setCyberThreats(this.cachedCyberThreats);
    if (this.cachedIranEvents) map.setIranEvents(this.cachedIranEvents);
    if (this.cachedNewsLocations) map.setNewsLocations(this.cachedNewsLocations);
    if (this.cachedPositiveEvents) map.setPositiveEvents(this.cachedPositiveEvents);
    if (this.cachedKindnessData) map.setKindnessData(this.cachedKindnessData);
    if (this.cachedHappinessScores) map.setHappinessScores(this.cachedHappinessScores);
    if (this.cachedCIIScores) map.setCIIScores(this.cachedCIIScores);
    if (this.cachedSpeciesRecovery) map.setSpeciesRecoveryZones(this.cachedSpeciesRecovery);
    if (this.cachedRenewableInstallations) map.setRenewableInstallations(this.cachedRenewableInstallations);
    if (this.cachedHotspotActivity) map.updateHotspotActivity(this.cachedHotspotActivity);
    if (this.cachedEscalationFlights && this.cachedEscalationVessels) map.updateMilitaryForEscalation(this.cachedEscalationFlights, this.cachedEscalationVessels);
    if (this.cachedImageryScenes) map.setImageryScenes(this.cachedImageryScenes);
  }

  public render(): void {
    if (this.useGlobe) {
      this.globeMap?.render();
    } else if (this.useDeckGL) {
      this.deckGLMap?.render();
    } else {
      this.svgMap?.render();
    }
  }

  public resize(): void {
    if (this.useGlobe) {
      this.globeMap?.resize();
    } else if (this.useDeckGL) {
      this.deckGLMap?.resize();
    } else {
      (this.svgMap as any)?.resize?.();
    }
  }

  public setIsResizing(isResizing: boolean): void {
    this.isResizingInternal = isResizing;
    if (this.useGlobe) {
      this.globeMap?.setIsResizing(isResizing);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setIsResizing(isResizing);
    } else {
      this.svgMap?.setIsResizing(isResizing);
    }
  }

  public setView(view: MapView): void {
    this.initialState.view = view;
    if (this.useGlobe) {
      this.globeMap?.setView(view);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setView(view as DeckMapView);
    } else {
      this.svgMap?.setView(view);
    }
  }

  public setZoom(zoom: number): void {
    if (this.useGlobe) {
      this.globeMap?.setZoom(zoom);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setZoom(zoom);
    } else {
      this.svgMap?.setZoom(zoom);
    }
  }

  public setCenter(lat: number, lon: number, zoom?: number): void {
    if (this.useGlobe) {
      this.globeMap?.setCenter(lat, lon, zoom);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setCenter(lat, lon, zoom);
    } else {
      this.svgMap?.setCenter(lat, lon);
      if (zoom != null) this.svgMap?.setZoom(zoom);
    }
  }

  public getCenter(): { lat: number; lon: number } | null {
    if (this.useGlobe) return this.globeMap?.getCenter() ?? null;
    if (this.useDeckGL) return this.deckGLMap?.getCenter() ?? null;
    return this.svgMap?.getCenter() ?? null;
  }

  public setTimeRange(range: TimeRange): void {
    if (this.useGlobe) {
      this.globeMap?.setTimeRange(range);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setTimeRange(range);
    } else {
      this.svgMap?.setTimeRange(range);
    }
  }

  public getTimeRange(): TimeRange {
    if (this.useGlobe) return this.globeMap?.getTimeRange() ?? '7d';
    if (this.useDeckGL) return this.deckGLMap?.getTimeRange() ?? '7d';
    return this.svgMap?.getTimeRange() ?? '7d';
  }

  public setLayers(layers: MapLayers): void {
    if (this.useGlobe) {
      this.globeMap?.setLayers(layers);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setLayers(layers);
    } else {
      this.svgMap?.setLayers(layers);
    }
  }

  public getState(): MapContainerState {
    if (this.useGlobe) return this.globeMap?.getState() ?? this.initialState;
    if (this.useDeckGL) {
      const state = this.deckGLMap?.getState();
      return state ? { ...state, view: state.view as MapView } : this.initialState;
    }
    return this.svgMap?.getState() ?? this.initialState;
  }

  public setEarthquakes(earthquakes: Earthquake[]): void {
    this.cachedEarthquakes = earthquakes;
    if (this.useGlobe) {
      this.globeMap?.setEarthquakes(earthquakes);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setEarthquakes(earthquakes);
    } else {
      this.svgMap?.setEarthquakes(earthquakes);
    }
  }

  public setWeatherAlerts(alerts: WeatherAlert[]): void {
    this.cachedWeatherAlerts = alerts;
    if (this.useGlobe) {
      this.globeMap?.setWeatherAlerts(alerts);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setWeatherAlerts(alerts);
    } else {
      this.svgMap?.setWeatherAlerts(alerts);
    }
  }

  public setOutages(outages: InternetOutage[]): void {
    this.cachedOutages = outages;
    if (this.useGlobe) {
      this.globeMap?.setOutages(outages);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setOutages(outages);
    } else {
      this.svgMap?.setOutages(outages);
    }
  }

  public setAisData(disruptions: AisDisruptionEvent[], density: AisDensityZone[]): void {
    this.cachedAisDisruptions = disruptions;
    this.cachedAisDensity = density;
    if (this.useGlobe) {
      this.globeMap?.setAisData(disruptions, density);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setAisData(disruptions, density);
    } else {
      this.svgMap?.setAisData(disruptions, density);
    }
  }

  public setCableActivity(advisories: CableAdvisory[], repairShips: RepairShip[]): void {
    this.cachedCableAdvisories = advisories;
    this.cachedRepairShips = repairShips;
    if (this.useGlobe) {
      this.globeMap?.setCableActivity(advisories, repairShips);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setCableActivity(advisories, repairShips);
    } else {
      this.svgMap?.setCableActivity(advisories, repairShips);
    }
  }

  public setCableHealth(healthMap: Record<string, CableHealthRecord>): void {
    this.cachedCableHealth = healthMap;
    if (this.useGlobe) {
      this.globeMap?.setCableHealth(healthMap);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setCableHealth(healthMap);
    } else {
      this.svgMap?.setCableHealth(healthMap);
    }
  }

  public setProtests(events: SocialUnrestEvent[]): void {
    this.cachedProtests = events;
    if (this.useGlobe) {
      this.globeMap?.setProtests(events);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setProtests(events);
    } else {
      this.svgMap?.setProtests(events);
    }
  }

  public setFlightDelays(delays: AirportDelayAlert[]): void {
    this.cachedFlightDelays = delays;
    if (this.useGlobe) {
      this.globeMap?.setFlightDelays(delays);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setFlightDelays(delays);
    } else {
      this.svgMap?.setFlightDelays(delays);
    }
  }

  public setAircraftPositions(positions: PositionSample[]): void {
    this.cachedAircraftPositions = positions;
    if (this.useDeckGL) {
      this.deckGLMap?.setAircraftPositions(positions);
    } else {
      this.svgMap?.setAircraftPositions(positions);
    }
  }

  public setMilitaryFlights(flights: MilitaryFlight[], clusters: MilitaryFlightCluster[] = []): void {
    this.cachedMilitaryFlights = flights;
    this.cachedMilitaryFlightClusters = clusters;
    if (this.useGlobe) {
      this.globeMap?.setMilitaryFlights(flights, clusters);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setMilitaryFlights(flights, clusters);
    } else {
      this.svgMap?.setMilitaryFlights(flights, clusters);
    }
  }

  public setMilitaryVessels(vessels: MilitaryVessel[], clusters: MilitaryVesselCluster[] = []): void {
    this.cachedMilitaryVessels = vessels;
    this.cachedMilitaryVesselClusters = clusters;
    if (this.useGlobe) {
      this.globeMap?.setMilitaryVessels(vessels, clusters);
    } else if (this.useDeckGL) {
      this.deckGLMap?.setMilitaryVessels(vessels, clusters);
    } else {
      this.svgMap?.setMilitaryVessels(vessels, clusters);
    }
  }

  public setNaturalEvents(events: NaturalEvent[]): void {
    this.cachedNaturalEvents = events;
    if (this.useGlobe) { this.globeMap?.setNaturalEvents(events); return; }
    if (this.useDeckGL) { this.deckGLMap?.setNaturalEvents(events); } else { this.svgMap?.setNaturalEvents(events); }
  }

  public setFires(fires: FireMarker[]): void {
    this.cachedFires = fires;
    if (this.useGlobe) { this.globeMap?.setFires(fires); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setFires(fires);
    } else {
      this.svgMap?.setFires(fires);
    }
  }

  public setTechEvents(events: TechEventMarker[]): void {
    this.cachedTechEvents = events;
    if (this.useGlobe) { this.globeMap?.setTechEvents(events); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setTechEvents(events);
    } else {
      this.svgMap?.setTechEvents(events);
    }
  }

  public setUcdpEvents(events: UcdpGeoEvent[]): void {
    this.cachedUcdpEvents = events;
    if (this.useGlobe) { this.globeMap?.setUcdpEvents(events); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setUcdpEvents(events);
    }
  }

  public setDisplacementFlows(flows: DisplacementFlow[]): void {
    this.cachedDisplacementFlows = flows;
    if (this.useGlobe) { this.globeMap?.setDisplacementFlows(flows); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setDisplacementFlows(flows);
    }
  }

  public setClimateAnomalies(anomalies: ClimateAnomaly[]): void {
    this.cachedClimateAnomalies = anomalies;
    if (this.useGlobe) { this.globeMap?.setClimateAnomalies(anomalies); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setClimateAnomalies(anomalies);
    }
  }

  public setGpsJamming(hexes: GpsJamHex[]): void {
    this.cachedGpsJamming = hexes;
    if (this.useGlobe) { this.globeMap?.setGpsJamming(hexes); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setGpsJamming(hexes);
    }
  }

  public setSatellites(satellites: SatellitePosition[]): void {
    this.cachedSatellites = satellites;
    if (this.useGlobe) { this.globeMap?.setSatellites(satellites); return; }
    if (this.useDeckGL) { this.deckGLMap?.setSatellites(satellites); } else { this.svgMap?.setSatellites(satellites); }
  }

  public setCyberThreats(threats: CyberThreat[]): void {
    this.cachedCyberThreats = threats;
    if (this.useGlobe) { this.globeMap?.setCyberThreats(threats); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setCyberThreats(threats);
    } else {
      this.svgMap?.setCyberThreats(threats);
    }
  }

  public setIranEvents(events: IranEvent[]): void {
    this.cachedIranEvents = events;
    if (this.useGlobe) { this.globeMap?.setIranEvents(events); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setIranEvents(events);
    } else {
      this.svgMap?.setIranEvents(events);
    }
  }

  public setImageryScenes(scenes: ImageryScene[]): void {
    this.cachedImageryScenes = scenes;
    if (this.useGlobe) { this.globeMap?.setImageryScenes(scenes); return; }
    if (this.useDeckGL) { this.deckGLMap?.setImageryScenes(scenes); } else { this.svgMap?.setImageryScenes(scenes); }
  }

  public setNewsLocations(data: NewsLocationMarker[]): void {
    this.cachedNewsLocations = data;
    if (this.useGlobe) { this.globeMap?.setNewsLocations(data); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setNewsLocations(data);
    } else {
      this.svgMap?.setNewsLocations(data);
    }
  }

  public setPositiveEvents(events: PositiveGeoEvent[]): void {
    this.cachedPositiveEvents = events;
    if (this.useGlobe) { this.globeMap?.setPositiveEvents(events); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setPositiveEvents(events);
    }
  }

  public setKindnessData(points: KindnessPoint[]): void {
    this.cachedKindnessData = points;
    if (this.useGlobe) { this.globeMap?.setKindnessData(points); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setKindnessData(points);
    }
  }

  public setHappinessScores(data: HappinessData): void {
    this.cachedHappinessScores = data;
    if (this.useGlobe) { this.globeMap?.setHappinessScores(data); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setHappinessScores(data);
    }
  }

  public setCIIScores(scores: CIIScore[]): void {
    this.cachedCIIScores = scores;
    if (this.useGlobe) { this.globeMap?.setCIIScores(scores); return; }
    if (this.useDeckGL) { this.deckGLMap?.setCIIScores(scores); }
  }

  public setSpeciesRecoveryZones(species: SpeciesRecovery[]): void {
    this.cachedSpeciesRecovery = species;
    if (this.useGlobe) { this.globeMap?.setSpeciesRecoveryZones(species); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setSpeciesRecoveryZones(species);
    }
  }

  public setRenewableInstallations(installations: RenewableInstallation[]): void {
    this.cachedRenewableInstallations = installations;
    if (this.useGlobe) { this.globeMap?.setRenewableInstallations(installations); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setRenewableInstallations(installations);
    }
  }

  public updateHotspotActivity(news: NewsItem[]): void {
    this.cachedHotspotActivity = news;
    if (this.useDeckGL) {
      this.deckGLMap?.updateHotspotActivity(news);
    } else {
      this.svgMap?.updateHotspotActivity(news);
    }
  }

  public updateMilitaryForEscalation(flights: MilitaryFlight[], vessels: MilitaryVessel[]): void {
    this.cachedEscalationFlights = flights;
    this.cachedEscalationVessels = vessels;
    if (this.useDeckGL) {
      this.deckGLMap?.updateMilitaryForEscalation(flights, vessels);
    } else {
      this.svgMap?.updateMilitaryForEscalation(flights, vessels);
    }
  }

  public getHotspotDynamicScore(hotspotId: string) {
    if (this.useDeckGL) return this.deckGLMap?.getHotspotDynamicScore(hotspotId);
    return this.svgMap?.getHotspotDynamicScore(hotspotId);
  }

  public highlightAssets(assets: RelatedAsset[] | null): void {
    if (this.useDeckGL) {
      this.deckGLMap?.highlightAssets(assets);
    } else {
      this.svgMap?.highlightAssets(assets);
    }
  }

  public setOnHotspotClick(callback: (hotspot: Hotspot) => void): void {
    this.cachedOnHotspotClicked = callback;
    if (this.useGlobe) { this.globeMap?.setOnHotspotClick(callback); return; }
    if (this.useDeckGL) { this.deckGLMap?.setOnHotspotClick(callback); } else { this.svgMap?.setOnHotspotClick(callback); }
  }


  public setOnTimeRangeChange(callback: (range: TimeRange) => void): void {
    this.cachedOnTimeRangeChanged = callback;
    if (this.useGlobe) { this.globeMap?.setOnTimeRangeChange(callback); return; }
    if (this.useDeckGL) { this.deckGLMap?.setOnTimeRangeChange(callback); } else { this.svgMap?.setOnTimeRangeChange(callback); }
  }

  public onTimeRangeChanged(callback: (range: TimeRange) => void): void {
    this.setOnTimeRangeChange(callback);
  }

  public setOnLayerChange(callback: (layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void): void {
    this.cachedOnLayerChange = callback;
    if (this.useGlobe) { this.globeMap?.setOnLayerChange(callback); return; }
    if (this.useDeckGL) { this.deckGLMap?.setOnLayerChange(callback); } else { this.svgMap?.setOnLayerChange(callback); }
  }

  public setOnAircraftPositionsUpdate(callback: (positions: PositionSample[]) => void): void {
    this.cachedOnAircraftPositionsUpdate = callback;
    if (this.useDeckGL) {
      this.deckGLMap?.setOnAircraftPositionsUpdate(callback);
    }
  }

  public onCountryClicked(callback: (country: CountryClickPayload) => void): void {
    this.setOnCountryClick(callback);
  }

  public onMapContextMenu(callback: (payload: { lat: number; lon: number; screenX: number; screenY: number }) => void): void {
    this.setOnMapContextMenu(callback);
  }

  public getBbox(): string | null {
    if (this.useDeckGL) return this.deckGLMap?.getBbox() ?? null;
    if (this.useGlobe) {
      const center = this.globeMap?.getCenter();
      if (!center) return null;
      const R = 5;
      const south = Math.max(-90, center.lat - R);
      const north = Math.min(90, center.lat + R);
      const west = Math.max(-180, center.lon - R);
      const east = Math.min(180, center.lon + R);
      return `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}`;
    }
    return null;
  }

  public setOnStateChange(callback: (state: MapContainerState) => void): void {
    this.cachedOnStateChange = callback;
    if (this.useGlobe) { this.globeMap?.setOnStateChange(callback); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setOnStateChange((state) => {
        callback({ ...state, view: state.view as MapView });
      });
    } else {
      this.svgMap?.setOnStateChange(callback);
    }
  }

  public onStateChanged(callback: (state: MapContainerState) => void): void {
    this.setOnStateChange(callback);
  }

  public getHotspotLevels(): Record<string, string> {
    if (this.useDeckGL) return this.deckGLMap?.getHotspotLevels() ?? {};
    return this.svgMap?.getHotspotLevels() ?? {};
  }

  public setHotspotLevels(levels: Record<string, string>): void {
    if (this.useDeckGL) {
      this.deckGLMap?.setHotspotLevels(levels);
    } else {
      this.svgMap?.setHotspotLevels(levels);
    }
  }

  public initEscalationGetters(): void {
    if (this.useDeckGL) {
      this.deckGLMap?.initEscalationGetters();
    } else {
      this.svgMap?.initEscalationGetters();
    }
  }

  public hideLayerToggle(layer: keyof MapLayers): void {
    if (this.useGlobe) { this.globeMap?.hideLayerToggle(layer); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.hideLayerToggle(layer);
    } else {
      this.svgMap?.hideLayerToggle(layer);
    }
  }

  public setLayerLoading(layer: keyof MapLayers, loading: boolean): void {
    if (this.useGlobe) { this.globeMap?.setLayerLoading(layer, loading); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setLayerLoading(layer, loading);
    } else {
      this.svgMap?.setLayerLoading(layer, loading);
    }
  }

  public setLayerReady(layer: keyof MapLayers, hasData: boolean): void {
    if (this.useGlobe) { this.globeMap?.setLayerReady(layer, hasData); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setLayerReady(layer, hasData);
    } else {
      this.svgMap?.setLayerReady(layer, hasData);
    }
  }

  public flashAssets(assetType: AssetType, ids: string[]): void {
    if (this.useDeckGL) this.deckGLMap?.flashAssets(assetType, ids);
  }

  public enableLayer(layer: keyof MapLayers): void {
    if (this.useGlobe) { this.globeMap?.enableLayer(layer); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.enableLayer(layer);
    } else {
      this.svgMap?.enableLayer(layer);
    }
  }

  public triggerHotspotClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerHotspotClick(id);
    } else {
      this.svgMap?.triggerHotspotClick(id);
    }
  }

  public triggerConflictClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerConflictClick(id);
    } else {
      this.svgMap?.triggerConflictClick(id);
    }
  }

  public triggerBaseClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerBaseClick(id);
    } else {
      this.svgMap?.triggerBaseClick(id);
    }
  }

  public triggerPipelineClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerPipelineClick(id);
    } else {
      this.svgMap?.triggerPipelineClick(id);
    }
  }

  public triggerCableClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerCableClick(id);
    } else {
      this.svgMap?.triggerCableClick(id);
    }
  }

  public triggerDatacenterClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerDatacenterClick(id);
    } else {
      this.svgMap?.triggerDatacenterClick(id);
    }
  }

  public triggerNuclearClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerNuclearClick(id);
    } else {
      this.svgMap?.triggerNuclearClick(id);
    }
  }

  public triggerIrradiatorClick(id: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.triggerIrradiatorClick(id);
    } else {
      this.svgMap?.triggerIrradiatorClick(id);
    }
  }

  public flashLocation(lat: number, lon: number, durationMs?: number): void {
    if (this.useGlobe) { this.globeMap?.flashLocation(lat, lon, durationMs); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.flashLocation(lat, lon, durationMs);
    } else {
      this.svgMap?.flashLocation(lat, lon, durationMs);
    }
  }

  public setOnCountryClick(callback: (country: CountryClickPayload) => void): void {
    this.cachedOnCountryClicked = callback;
    if (this.useGlobe) { this.globeMap?.setOnCountryClick(callback); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setOnCountryClick(callback);
    } else {
      this.svgMap?.setOnCountryClick?.(callback);
    }
  }

  public setOnMapContextMenu(callback: (payload: { lat: number; lon: number; screenX: number; screenY: number }) => void): void {
    this.cachedOnMapContextMenu = callback;
    if (this.useGlobe) { this.globeMap?.setOnMapContextMenu(callback); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setOnMapContextMenu(callback);
    } else {
      this.svgMap?.setOnMapContextMenu?.(callback);
    }
  }

  public fitCountry(code: string): void {
    if (this.useGlobe) { this.globeMap?.fitCountry(code); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.fitCountry(code);
    } else {
      this.svgMap?.fitCountry(code);
    }
  }

  public setOnSatelliteClick(callback: (sat: any) => void): void {
    this.cachedOnSatelliteClick = callback;
    if (this.useGlobe) { this.globeMap?.setOnSatelliteClick(callback); return; }
    if (this.useDeckGL) {
      this.deckGLMap?.setOnSatelliteClick(callback);
    } else {
      this.svgMap?.setOnSatelliteClick(callback);
    }
  }

  public highlightCountry(code: string): void {
    if (this.useDeckGL) {
      this.deckGLMap?.highlightCountry(code);
    }
  }

  public clearCountryHighlight(): void {
    if (this.useDeckGL) {
      this.deckGLMap?.clearCountryHighlight();
    }
  }

  public setRenderPaused(paused: boolean): void {
    if (this.useDeckGL) {
      this.deckGLMap?.setRenderPaused(paused);
    }
  }

  public isDeckGLMode(): boolean {
    return this.useDeckGL;
  }

  public isMobileMode(): boolean {
    return this.isMobile;
  }

  public destroy(): void {
    this.resizeObserver?.disconnect();
    this.globeMap?.destroy();
    this.deckGLMap?.destroy();
    this.svgMap?.destroy();
    this.div2d?.remove();
    this.div3d?.remove();
    this.clearCache();
  }

  private clearCache(): void {
    this.cachedOnStateChange = null;
    this.cachedOnLayerChange = null;
    this.cachedOnTimeRangeChanged = null;
    this.cachedOnCountryClicked = null;
    this.cachedOnHotspotClicked = null;
    this.cachedOnAircraftPositionsUpdate = null;
    this.cachedOnMapContextMenu = null;
    this.cachedEarthquakes = null;
    this.cachedWeatherAlerts = null;
    this.cachedOutages = null;
    this.cachedAisDisruptions = null;
    this.cachedAisDensity = null;
    this.cachedCableAdvisories = null;
    this.cachedRepairShips = null;
    this.cachedCableHealth = null;
    this.cachedProtests = null;
    this.cachedFlightDelays = null;
    this.cachedAircraftPositions = null;
    this.cachedMilitaryFlights = null;
    this.cachedMilitaryFlightClusters = null;
    this.cachedMilitaryVessels = null;
    this.cachedMilitaryVesselClusters = null;
    this.cachedNaturalEvents = null;
    this.cachedFires = null;
    this.cachedTechEvents = null;
    this.cachedUcdpEvents = null;
    this.cachedDisplacementFlows = null;
    this.cachedClimateAnomalies = null;
    this.cachedGpsJamming = null;
    this.cachedSatellites = null;
    this.cachedCyberThreats = null;
    this.cachedIranEvents = null;
    this.cachedNewsLocations = null;
    this.cachedPositiveEvents = null;
    this.cachedKindnessData = null;
    this.cachedHappinessScores = null;
    this.cachedCIIScores = null;
    this.cachedSpeciesRecovery = null;
    this.cachedRenewableInstallations = null;
    this.cachedHotspotActivity = null;
    this.cachedEscalationFlights = null;
    this.cachedEscalationVessels = null;
    this.cachedImageryScenes = null;
  }

  public get is3DMode(): boolean {
    return this.useGlobe;
  }

  public toggle3DMode(): boolean {
    console.log('[MapContainer] toggle3DMode called, current useGlobe:', this.useGlobe);
    if (this.useGlobe) {
      this.switchToFlat();
    } else {
      this.switchToGlobe();
    }
    console.log('[MapContainer] toggle3DMode finished, new useGlobe:', this.useGlobe);
    return this.useGlobe;
  }
}
