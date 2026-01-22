import L from "leaflet";

/**
 * Creates a custom Leaflet icon for displaying user's current location
 * Uses a green-colored marker to distinguish from default blue markers
 */
export function createUserLocationIcon(color: string = "#22c55e"): L.DivIcon {
    return L.divIcon({
        className: "user-location-marker",
        html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path fill="${color}" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.75 12.5 28.5 12.5 28.5s12.5-19.75 12.5-28.5C25 5.596 19.404 0 12.5 0z"/>
            <circle fill="white" cx="12.5" cy="12.5" r="5"/>
        </svg>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
}
