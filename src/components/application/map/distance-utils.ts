import L from "leaflet";

/**
 * Calculates the straight-line distance between two geographic points using Leaflet's distanceTo method.
 * Uses the Haversine formula for great-circle distance calculation.
 * @param point1 First point as [latitude, longitude]
 * @param point2 Second point as [latitude, longitude]
 * @returns Distance in meters
 */
export function calculateDistance(
    point1: [number, number],
    point2: [number, number]
): number {
    const latLng1 = L.latLng(point1[0], point1[1]);
    const latLng2 = L.latLng(point2[0], point2[1]);
    return latLng1.distanceTo(latLng2);
}

/**
 * Formats a distance in meters for display using US imperial units.
 * Shows feet for distances < 1 mile (5280 feet), miles for distances >= 1 mile.
 * @param meters Distance in meters
 * @returns Formatted distance string (e.g., "1,500 ft" or "2.5 mi")
 */
export function formatDistance(meters: number): string {
    const feet = meters * 3.28084; // Convert meters to feet
    const oneMileInFeet = 5280;
    
    if (feet < oneMileInFeet) {
        return `${Math.round(feet).toLocaleString()} ft`;
    }
    const miles = feet / oneMileInFeet;
    return `${miles.toFixed(1)} mi`;
}
