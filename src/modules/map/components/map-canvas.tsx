"use client";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  type StyleSpecification,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapLocationItem } from "../types";

interface MapCanvasProps {
  locations: MapLocationItem[];
  selectedLocation: MapLocationItem | null;
  onSelectLocation: (location: MapLocationItem | null) => void;
}

// Minimal, gallery-grade Esri World Light Gray Canvas raster basemap (light, neutral, clean)
const ESRI_LIGHT_GRAY_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-light-gray": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Sources: Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "esri-light-gray-layer",
      type: "raster",
      source: "esri-light-gray",
      minzoom: 0,
      maxzoom: 18,
    },
  ],
};

const THAILAND_CENTER: [number, number] = [100.5, 13.75]; // [lng, lat]
const DEFAULT_ZOOM = 5.5;

export function MapCanvas({
  locations,
  selectedLocation,
  onSelectLocation,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; element: HTMLElement }>>(new Map());

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: ESRI_LIGHT_GRAY_STYLE,
      center: THAILAND_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: {
        compact: true,
      },
    });

    // Add minimal navigation controls (zoom in/out, compass)
    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    // Clicking the background map deselects any active marker
    map.on("click", (e: MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (!target || !target.closest(".thaiarthub-marker")) {
        onSelectLocation(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectLocation]);

  // Sync markers whenever locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    if (locations.length === 0) return;

    // Create markers for each location
    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;

      // Marker container element
      const el = document.createElement("div");
      el.className = "thaiarthub-marker group relative cursor-pointer select-none";
      el.setAttribute("data-id", loc.id);

      // Render marker pin with contemporary gallery styling
      el.innerHTML = `
        <div class="relative flex items-center justify-center transition-transform duration-200 ${
          isSelected ? "scale-125 z-30" : "hover:scale-115 z-10"
        }">
          <div class="absolute -inset-2 rounded-full bg-primary/20 animate-ping opacity-75 ${
            isSelected ? "block" : "hidden group-hover:block"
          }"></div>
          <div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-all ${
            loc.type === "event"
              ? "bg-primary text-white"
              : "bg-stone-600 text-white"
          } ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : ""}">
            <div class="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <!-- Tooltip on hover -->
          <div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm backdrop-blur-xs transition-opacity duration-150 group-hover:opacity-100 ${
            isSelected ? "opacity-100" : ""
          }">
            ${loc.title}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectLocation(loc);
        map.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: Math.max(map.getZoom(), 11),
          essential: true,
          duration: 600,
        });
      });

      const marker = new Marker({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map);

      markersRef.current.set(loc.id, { marker, element: el });
    });

    // Fit map bounds to encompass all markers if multiple exist
    if (locations.length > 1) {
      const bounds = new LngLatBounds();
      locations.forEach((loc) => bounds.extend([loc.longitude, loc.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 13,
        duration: 1000,
      });
    } else if (locations.length === 1) {
      map.flyTo({
        center: [locations[0].longitude, locations[0].latitude],
        zoom: 12,
        duration: 1000,
      });
    }
  }, [locations, onSelectLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selected location visual state & flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(({ element }, id) => {
      const isSelected = selectedLocation?.id === id;
      const inner = element.querySelector("div");
      if (inner) {
        if (isSelected) {
          inner.classList.add("scale-125", "z-30");
          inner.classList.remove("hover:scale-115", "z-10");
        } else {
          inner.classList.remove("scale-125", "z-30");
          inner.classList.add("hover:scale-115", "z-10");
        }
      }
    });

    if (selectedLocation) {
      map.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: Math.max(map.getZoom(), 11),
        essential: true,
        duration: 600,
      });
    }
  }, [selectedLocation]);

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-2xl border border-border/80 bg-[#FAF8F5] shadow-xs sm:h-[640px]">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
