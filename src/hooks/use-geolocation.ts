import { useState, useCallback, useEffect, useRef } from "react";

export type GeolocationPosition = {
    position: [number, number]; // [lat, lng]
    accuracy: number;
};

export type GeolocationError = {
    code: number;
    message: string;
};

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export function useGeolocation() {
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<PermissionState>("unsupported");
    const hasCheckedPermissions = useRef(false);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({
                    position: [latitude, longitude],
                    accuracy: accuracy || 0,
                });
                setLoading(false);
            },
            (err: GeolocationPositionError) => {
                let errorMessage = "Unable to retrieve your location";
                
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                    default:
                        errorMessage = err.message || errorMessage;
                }
                
                setError(errorMessage);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    const clearLocation = useCallback(() => {
        setLocation(null);
        setError(null);
    }, []);

    // Check geolocation permission status and auto-request if granted
    useEffect(() => {
        // Only check permissions once on mount
        if (hasCheckedPermissions.current) return;
        hasCheckedPermissions.current = true;

        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setPermissionState("unsupported");
            return;
        }

        // Check if Permissions API is supported
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions
                .query({ name: "geolocation" as PermissionName })
                .then((permissionStatus) => {
                    const state = permissionStatus.state as PermissionState;
                    setPermissionState(state);

                    // Auto-request location if permission is already granted
                    if (state === "granted") {
                        requestLocation();
                    }

                    // Listen for permission changes (e.g., user revokes permission)
                    permissionStatus.onchange = () => {
                        const newState = permissionStatus.state as PermissionState;
                        setPermissionState(newState);
                        
                        // Clear location if permission is revoked
                        if (newState === "denied" || newState === "prompt") {
                            clearLocation();
                        }
                        
                        // Auto-request if permission is granted again
                        if (newState === "granted") {
                            requestLocation();
                        }
                    };
                })
                .catch(() => {
                    // Permissions API not fully supported, fall back to prompt state
                    setPermissionState("prompt");
                });
        } else {
            // Permissions API not supported, default to prompt state
            setPermissionState("prompt");
        }
    }, [requestLocation, clearLocation]);

    return {
        location,
        loading,
        error,
        permissionState,
        requestLocation,
        clearLocation,
    };
}
