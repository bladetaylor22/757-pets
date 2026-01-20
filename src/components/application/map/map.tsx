"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { MapMarker } from "./types";
import "leaflet/dist/leaflet.css";

export type TileStyle = "positron" | "dark-matter" | "voyager";

export const TILE_STYLES: Record<TileStyle, { url: string; attribution: string; name: string }> = {
    positron: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        name: "Positron",
    },
    "dark-matter": {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        name: "Dark Matter",
    },
    voyager: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        name: "Voyager",
    },
};

// Fix for Leaflet default icon in Next.js - run synchronously at module load
if (typeof window !== "undefined") {
    // Delete the default icon URL getter to prevent Leaflet from trying to load default icons
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    
    // Create a new default icon instance with proper configuration
    const DefaultIcon = new L.Icon({
        iconUrl: "/leaflet-images/marker-icon.png",
        iconRetinaUrl: "/leaflet-images/marker-icon-2x.png",
        shadowUrl: "/leaflet-images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        shadowAnchor: [12, 41],
    });
    
    // Set as the default icon for all markers
    L.Marker.prototype.options.icon = DefaultIcon;
}

export type MapProps = {
    center: [number, number]; // [lat, lng]
    zoom?: number;
    markers: MapMarker[];
    className?: string;
    tileStyle?: TileStyle;
    onTileStyleChange?: (style: TileStyle) => void;
};

export function Map({ center, zoom = 11, markers, className, tileStyle = "positron" }: MapProps) {
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component only renders on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const selectedTileConfig = TILE_STYLES[tileStyle];

    if (!isMounted) {
        return (
            <div className={className}>
                <div className="flex h-full min-h-[500px] items-center justify-center">
                    <div className="text-muted-foreground">Loading map...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ minHeight: "500px", height: "100%" }}
            >
                <TileLayer
                    key={tileStyle}
                    attribution={selectedTileConfig.attribution}
                    url={selectedTileConfig.url}
                    subdomains="abcd"
                />
                {markers.map((marker) => (
                    <Marker key={marker.id} position={marker.position}>
                        {marker.title && (
                            <Popup>
                                <div>
                                    <strong>{marker.title}</strong>
                                    {marker.description && (
                                        <div className="mt-1 text-sm">{marker.description}</div>
                                    )}
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
