"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import Supercluster from "supercluster";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import type { Place, PlaceType } from "@/lib/types";
import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import type { LatLng } from "@/lib/geo";
import studyMapConfig from "../../../studymap.config";
import type { Bounds } from "@/lib/places";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { PinPopup } from "@/components/pins/pin-popup";

type ClusterPointProps = { placeId: string; type: PlaceType };
type ClusterAggProps = Record<PlaceType, number>;

function emptyTypeCounts(): ClusterAggProps {
  return Object.fromEntries(PLACE_TYPES.map((type) => [type, 0])) as ClusterAggProps;
}

/** Builds a pie-style divIcon: a conic-gradient ring colored by place type, count in the middle. */
function clusterIcon(counts: ClusterAggProps, total: number, label: string): L.DivIcon {
  let acc = 0;
  const stops: string[] = [];
  for (const type of PLACE_TYPES) {
    const n = counts[type];
    if (n === 0) continue;
    const from = (acc / total) * 360;
    acc += n;
    const to = (acc / total) * 360;
    stops.push(`${PLACE_TYPE_COLORS[type]} ${from}deg ${to}deg`);
  }
  const size = total < 10 ? 36 : total < 50 ? 44 : 54;
  return L.divIcon({
    html: `<div class="cluster-pie" style="width:${size}px;height:${size}px;background:conic-gradient(${stops.join(", ")});box-sizing:border-box;" role="button" tabindex="0" aria-label="${label}"><span>${total}</span></div>`,
    className: "cluster-pie-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Summarizes a cluster's contents for assistive tech, e.g. "Cluster of 11 places, mostly SAT centre". */
function clusterLabel(counts: ClusterAggProps, total: number): string {
  let dominant: PlaceType | null = null;
  let dominantCount = 0;
  for (const type of PLACE_TYPES) {
    if (counts[type] > dominantCount) {
      dominant = type;
      dominantCount = counts[type];
    }
  }
  if (!dominant || dominant === "other_places") {
    return `Cluster of ${total} ${total === 1 ? "place" : "places"}`;
  }
  return `Cluster of ${total} ${total === 1 ? "place" : "places"}, mostly ${PLACE_TYPE_LABELS[dominant].toLowerCase()}`;
}

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `<div class="pin-marker" style="background-color:${color};"></div>`,
    className: "pin-marker-icon",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

function boundsToBbox(bounds: L.LatLngBounds): [number, number, number, number] {
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}

/**
 * Clusters nearby pins into pie-style circles (colored by place type) so
 * dense areas don't render as a pile of overlapping markers. Isolated pins
 * render exactly as the plain PlaceMarker below; only overlapping points
 * change appearance, and clicking a cluster zooms into it.
 */
function ClusteredMarkers({ places }: { places: Place[] }) {
  const map = useMap();
  const [bbox, setBbox] = useState<[number, number, number, number]>(() =>
    boundsToBbox(map.getBounds()),
  );
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom()));

  useEffect(() => {
    function update() {
      setBbox(boundsToBbox(map.getBounds()));
      setZoom(Math.round(map.getZoom()));
    }
    update();
    map.on("moveend", update);
    map.on("zoomend", update);
    return () => {
      map.off("moveend", update);
      map.off("zoomend", update);
    };
  }, [map]);

  const index = useMemo(() => {
    const sc = new Supercluster<ClusterPointProps, ClusterAggProps>({
      radius: 90,
      maxZoom: 16,
      map: (props) => {
        const counts = emptyTypeCounts();
        counts[props.type] += 1;
        return counts;
      },
      reduce: (acc, props) => {
        for (const type of PLACE_TYPES) acc[type] += props[type];
      },
    });
    sc.load(
      places.map((place) => ({
        type: "Feature",
        properties: { placeId: place.id, type: place.type },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      })),
    );
    return sc;
  }, [places]);

  const clusters = useMemo(() => index.getClusters(bbox, zoom), [index, bbox, zoom]);

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const properties = feature.properties;

        if ("cluster" in properties) {
          const { cluster_id: clusterId, point_count: count } = properties;
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={clusterIcon(properties, count, clusterLabel(properties, count))}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    index.getClusterExpansionZoom(clusterId),
                    18,
                  );
                  map.flyTo([lat, lng], expansionZoom, { duration: 0.5 });
                },
                keydown: (e) => {
                  if (e.originalEvent.key !== "Enter" && e.originalEvent.key !== " ") return;
                  e.originalEvent.preventDefault();
                  const expansionZoom = Math.min(
                    index.getClusterExpansionZoom(clusterId),
                    18,
                  );
                  map.flyTo([lat, lng], expansionZoom, { duration: 0.5 });
                },
              }}
            />
          );
        }

        const place = places.find((p) => p.id === properties.placeId);
        if (!place) return null;
        return (
          <Marker
            key={place.id}
            position={[lat, lng]}
            icon={pinIcon(PLACE_TYPE_COLORS[place.type])}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              },
            }}
          >
            <Popup autoPan={false} closeOnClick={false}>
              <PinPopup place={place} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

interface MapViewProps {
  places: Place[];
  userLocation?: LatLng | null;
  focusId?: string | null;
  /** Bounding box to fly to, e.g. the selected city's pins. */
  focusBounds?: Bounds | null;
  /** When false, the map is a static preview: no pan, zoom, or controls. */
  interactive?: boolean;
  /** Initial zoom level; falls back to the MMR default. */
  zoom?: number;
  /** Initial center, as [lat, lng]; falls back to the configured region center. */
  center?: [number, number];
  /** When set, the map starts at this viewport instead of fitting all places. */
  initialViewport?: MapViewport | null;
  /** Fired on pan/zoom end with the current center and zoom. */
  onViewportChange?: (viewport: MapViewport) => void;
  /** Increment to imperatively close all open popups. */
  closePopupTrigger?: number;
}

/** Closes all open popups whenever the trigger counter increments. */
function ClosePopupOnTrigger({ trigger }: { trigger: number }) {
  const map = useMap();
  const prev = useRef(trigger);
  useEffect(() => {
    if (trigger !== prev.current) {
      prev.current = trigger;
      map.closePopup();
    }
  }, [map, trigger]);
  return null;
}

/** Eases the map to the user's location when it is first set. */
function FlyToUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 });
  }, [map, lat, lng]);
  return null;
}

/** Eases the map to a focused place whenever the focused id changes. */
function FlyToPlace({ id, lat, lng }: { id: string; lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [map, id, lat, lng]);
  return null;
}

/** Fits the initial view to every place's extent, once, so the map opens
 * showing the whole dataset instead of a fixed Mumbai-only crop. */
function FitAllOnMount({ places }: { places: Place[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || places.length === 0) return;
    fitted.current = true;
    const lats = places.map((p) => p.lat);
    const lngs = places.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [32, 32] },
    );
  }, [map, places]);
  return null;
}

/** Eases the map to fit a bounding box, e.g. a selected city's pins. */
function FlyToBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap();
  useEffect(() => {
    map.flyToBounds(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ],
      { padding: [48, 48], duration: 1, maxZoom: 15 },
    );
  }, [map, bounds]);
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
    <>
      <div className={`scroll-zoom-hint${hint ? " visible" : ""}`} aria-hidden>
        Use Ctrl/Cmd + scroll to zoom the map
      </div>
      <span className="sr-only" role="note">
        Zoom the map with the + and - keys, or Ctrl/Cmd + scroll
      </span>
    </>
  );
}

/**
 * Reports the map center and zoom to the parent whenever the user pans or
 * zooms, so the URL can stay in sync (see #118). Dedupes identical values
 * so an unchanged viewport never rewrites the URL.
 */
function ViewportReporter({
  onViewportChange,
}: {
  onViewportChange: (viewport: MapViewport) => void;
}) {
  const map = useMap();
  const last = useRef<string>("");

  useEffect(() => {
    function report() {
      const center = map.getCenter();
      const viewport = {
        lat: Math.round(center.lat * 1e5) / 1e5,
        lng: Math.round(center.lng * 1e5) / 1e5,
        zoom: Math.round(map.getZoom() * 10) / 10,
      };
      const key = `${viewport.lat},${viewport.lng},${viewport.zoom}`;
      if (key === last.current) return;
      last.current = key;
      onViewportChange(viewport);
    }
    map.on("moveend", report);
    map.on("zoomend", report);
    return () => {
      map.off("moveend", report);
      map.off("zoomend", report);
    };
  }, [map, onViewportChange]);

  return null;
}

/**
 * Keeps Leaflet's tile grid in sync with the container's real size.
 * Without this, anything that resizes the map div (mobile browser chrome
 * collapsing, orientation change, the lg sidebar breakpoint) leaves stale
 * tile bounds behind, which renders as blank tiles at the edges.
 */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let frame: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize());
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

export default function MapView({
  places,
  userLocation,
  focusId,
  focusBounds,
  interactive = true,
  zoom = studyMapConfig.defaultZoom,
  center = studyMapConfig.center,
  initialViewport = null,
  onViewportChange,
  closePopupTrigger = 0,
}: MapViewProps) {
  const focusPlace = focusId
    ? places.find((place) => place.id === focusId)
    : undefined;

  // Same colorful MapTiler "streets" style in both themes — every dark-mode
  // map style (CARTO, MapTiler, Mapbox alike) is conventionally muted for
  // legibility, which read as "not colorful" against the brief, so dark
  // mode reuses the light style instead of a washed-out dark variant.
  const tileVariant = "streets";

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
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      zoomControl={interactive}
      attributionControl={interactive}
      closePopupOnClick={false}
      className="size-full"
    >
      <TileLayer
        key={tileVariant}
        attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        url={`https://api.maptiler.com/maps/${tileVariant}/256/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
        maxZoom={20}
        keepBuffer={2}
        updateWhenZooming={false}
        detectRetina
      />

      <MapResizeHandler />
      <ClosePopupOnTrigger trigger={closePopupTrigger} />
      {interactive && <ScrollZoomGuard />}
      {interactive && onViewportChange && (
        <ViewportReporter onViewportChange={onViewportChange} />
      )}
      {interactive && !userLocation && !focusPlace && !focusBounds && !initialViewport && (
        <FitAllOnMount places={places} />
      )}

      {userLocation && (
        <FlyToUser lat={userLocation.lat} lng={userLocation.lng} />
      )}
      {focusPlace && (
        <FlyToPlace id={focusPlace.id} lat={focusPlace.lat} lng={focusPlace.lng} />
      )}
      {!userLocation && !focusPlace && focusBounds && (
        <FlyToBounds bounds={focusBounds} />
      )}

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

      <ClusteredMarkers places={places} />
    </MapContainer>
    </div>
  );
}
