"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/application/map/types";
import type { TileStyle } from "@/components/application/map/map";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import("@/components/application/map/map").then((mod) => ({ default: mod.Map })), {
    ssr: false,
    loading: () => (
        <div className="flex h-[600px] items-center justify-center rounded-lg border border-secondary bg-secondary">
            <div className="text-muted-foreground">Loading map...</div>
        </div>
    ),
});

// Sample locations in Hampton Roads, Virginia
const sampleMarkers: MapMarker[] = [
    {
        id: "norfolk",
        position: [36.8468, -76.2852],
        title: "Norfolk City Center",
        description: "Sample location in Norfolk, VA",
    },
    {
        id: "virginia-beach",
        position: [36.8529, -75.978],
        title: "Virginia Beach City Center",
        description: "Sample location in Virginia Beach, VA",
    },
    {
        id: "chesapeake",
        position: [36.7682, -76.2875],
        title: "Chesapeake City Center",
        description: "Sample location in Chesapeake, VA",
    },
    {
        id: "suffolk",
        position: [36.7282, -76.5836],
        title: "Suffolk City Center",
        description: "Sample location in Suffolk, VA",
    },
];

// Center point for Hampton Roads region
const hamptonRoadsCenter: [number, number] = [36.8, -76.3];

export default function TestMapPage() {
    const [tileStyle, setTileStyle] = useState<TileStyle>("positron");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
            <div className="w-full max-w-6xl space-y-6 rounded-lg border border-secondary bg-secondary p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Map Test - Hampton Roads</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Testing Leaflet map integration with sample locations across Hampton Roads cities.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-secondary">Map Style</label>
                        <ButtonGroup
                            selectedKeys={new Set([tileStyle])}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as TileStyle;
                                if (selected) setTileStyle(selected);
                            }}
                        >
                            <ButtonGroupItem id="positron">Positron</ButtonGroupItem>
                            <ButtonGroupItem id="dark-matter">Dark Matter</ButtonGroupItem>
                            <ButtonGroupItem id="voyager">Voyager</ButtonGroupItem>
                        </ButtonGroup>
                    </div>
                </div>
                <div className="h-[600px] w-full overflow-hidden rounded-lg border border-primary">
                    <Map center={hamptonRoadsCenter} zoom={10} markers={sampleMarkers} tileStyle={tileStyle} className="h-full w-full" />
                </div>
                <div className="rounded-lg bg-primary p-4">
                    <h2 className="mb-2 font-semibold">Sample Locations</h2>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        {sampleMarkers.map((marker) => (
                            <li key={marker.id}>
                                <strong>{marker.title}</strong>: {marker.description}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
