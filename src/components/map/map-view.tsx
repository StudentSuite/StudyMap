"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import type { PersonalPin, Place } from "@/lib/types";
import type { LatLng } from "@/lib/geo";
import { MMR_CENTER, MMR_DEFAULT_ZOOM } from "@/lib/places";
import { PERSONAL_PIN_COLOR, PLACE_TYPE_COLORS, directionsUrl } from "@/lib/map";
import { PinPopup } from "@/components/pins/pin-popup";

interface MapViewProps {
  places: Place[];
  personalPins?: PersonalPin[];
  userLocation?: LatLng | null;
  focusId?: string | null;
}

/** Eases the map to a coordinate when it changes. */
function FlyTo({ to, zoom }: { to: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([to.lat, to.lng], zoom, { duration: 1 });
  }, [map, to, zoom]);
  return null;
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
  personalPins = [],
  userLocation,
  focusId,
}: MapViewProps) {
  const focusPlace = focusId
    ? places.find((place) => place.id === focusId)
    : undefined;

  return (
    <MapContainer
      center={MMR_CENTER}
      zoom={MMR_DEFAULT_ZOOM}
      scrollWheelZoom
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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

      {personalPins.map((pin) => (
        <CircleMarker
          key={pin.id}
          center={[pin.lat, pin.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            dashArray: "3 3",
            fillColor: PERSONAL_PIN_COLOR,
            fillOpacity: 0.95,
          }}
        >
          <Tooltip>{pin.name} (private)</Tooltip>
          <Popup>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{pin.name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {pin.type} . private pin
              </p>
              {pin.note && <p className="text-xs">{pin.note}</p>}
              <a
                href={directionsUrl(pin.lat, pin.lng)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary underline underline-offset-2"
              >
                Get directions
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
