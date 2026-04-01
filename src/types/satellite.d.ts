declare module 'satellite.js' {
  export interface SatRec {
    // Basic SatRec properties as needed
    satnum: string;
    epochyr: number;
    epochdays: number;
    jdsatepoch: number;
    // ... add more if required by the code
  }

  export function twoline2satrec(longstr1: string, longstr2: string): SatRec;
  export function propagate(satrec: SatRec, date: Date): { position: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number } };
  export function gstime(date: Date): number;
  export function eciToGeodetic(eciCoords: { x: number; y: number; z: number }, gmst: number): { longitude: number; latitude: number; height: number };
  export function degreesLong(radians: number): number;
  export function degreesLat(radians: number): number;
}
