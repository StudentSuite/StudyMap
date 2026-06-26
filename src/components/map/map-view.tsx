"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import type { Place } from "@/lib/types";
import type { LatLng } from "@/lib/geo";
import { MAP_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { PinPopup } from "@/components/pins/pin-popup";

interface MapViewProps {
  places: Place[];
  userLocation?: LatLng | null;
  focusId?: string | null;
  /** When false, the map is a static preview: no pan, zoom, or controls. */
  interactive?: boolean;
  /** Initial zoom level; falls back to the MMR default. */
  zoom?: number;
}

/** Eases the map to a coordinate when it changes. */
function FlyTo({ to, zoom }: { to: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([to.lat, to.lng], zoom, { duration: 1 });
  }, [map, to, zoom]);
  return null;
}

/**
 * Google-Maps-style scroll guard: plain scroll scrolls the page, Ctrl+scroll
 * (Cmd on Mac) zooms the map. Shows a brief hint overlay otherwise.
 * Touch pinch-zoom is unaffected.
 */
function ScrollZoomGuard() {
  const map = useMap();
  const [hint, setHint] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    map.scrollWheelZoom.disable();

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (!map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
        setHint(false);
      } else {
        if (map.scrollWheelZoom.enabled()) map.scrollWheelZoom.disable();
        setHint(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setHint(false), 1200);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!event.ctrlKey && !event.metaKey) map.scrollWheelZoom.disable();
    }

    container.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("keyup", onKeyUp);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [map]);

  return (
    <div className={`scroll-zoom-hint${hint ? " visible" : ""}`} aria-hidden>
      Use Ctrl + scroll to zoom the map
    </div>
  );
}

/** A public place marker; opens its popup on load when it is the focused pin. */
function PlaceMarker({ place, autoOpen }: { place: Place; autoOpen: boolean }) {
  const ref = useRef<LeafletCircleMarker>(null);
  useEffect(() => {
    if (autoOpen) ref.current?.openPopup();
  }, [autoOpen]);

  return (
    <CircleMarker
      ref={ref}
      center={[place.lat, place.lng]}
      radius={8}
      pathOptions={{
        color: "#ffffff",
        weight: 1.5,
        fillColor: PLACE_TYPE_COLORS[place.type],
        fillOpacity: 0.9,
      }}
    >
      <Tooltip>{place.name}</Tooltip>
      <Popup>
        <PinPopup place={place} />
      </Popup>
    </CircleMarker>
  );
}

export default function MapView({
  places,
  userLocation,
  focusId,
  interactive = true,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const focusPlace = focusId
    ? places.find((place) => place.id === focusId)
    : undefined;

  return (
    <div
      role={interactive ? "region" : "img"}
      aria-label={
        interactive
          ? "Interactive map of student places"
          : "Map preview of student places"
      }
      className="size-full"
    >
    <MapContainer
      center={MAP_CENTER}
      zoom={zoom}
      scrollWheelZoom={false}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      zoomControl={interactive}
      attributionControl={interactive}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {interactive && <ScrollZoomGuard />}

      {userLocation ? (
        <FlyTo to={userLocation} zoom={14} />
      ) : focusPlace ? (
        <FlyTo to={{ lat: focusPlace.lat, lng: focusPlace.lng }} zoom={15} />
      ) : null}

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={7}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 1,
          }}
        >
          <Tooltip>You are here</Tooltip>
        </CircleMarker>
      )}

      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          autoOpen={place.id === focusId}
        />
      ))}
    </MapContainer>
    </div>
  );
}
