"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";

import type { PersonalPin, Place } from "@/lib/types";
import { MMR_CENTER, MMR_DEFAULT_ZOOM } from "@/lib/places";
import { PERSONAL_PIN_COLOR, PLACE_TYPE_COLORS, directionsUrl } from "@/lib/map";
import { PinPopup } from "@/components/pins/pin-popup";

interface MapViewProps {
  places: Place[];
  personalPins?: PersonalPin[];
}

export default function MapView({ places, personalPins = [] }: MapViewProps) {
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

      {places.map((place) => (
        <CircleMarker
          key={place.id}
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
