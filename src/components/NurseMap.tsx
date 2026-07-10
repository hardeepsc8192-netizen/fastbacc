"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Nurse } from "@/lib/types";

// Continental US bounding box — the map's default scope.
const US_BOUNDS: [[number, number], [number, number]] = [
  [24.5, -125],
  [49.5, -66.9],
];

function pinIcon(highlighted: boolean) {
  const size = highlighted ? 34 : 26;
  const fill = highlighted ? "#FFB81C" : "#154734";
  const accent = highlighted ? "#154734" : "#FFB81C";
  return L.divIcon({
    className: "",
    html: `<svg width="${size}" height="${Math.round(size * 1.3)}" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${fill}" stroke="${accent}" stroke-width="2"/>
      <circle cx="13" cy="13" r="5" fill="${accent}"/>
    </svg>`,
    iconSize: [size, Math.round(size * 1.3)],
    iconAnchor: [size / 2, Math.round(size * 1.3)],
    popupAnchor: [0, -size],
  });
}

function FlyToSelected({ nurse }: { nurse: Nurse | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (nurse) {
      map.flyTo([nurse.lat, nurse.lng], Math.max(map.getZoom(), 7), {
        duration: 0.75,
      });
    }
  }, [nurse, map]);
  return null;
}

export default function NurseMap({
  nurses,
  selectedId,
  onSelect,
}: {
  nurses: Nurse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selectedNurse = nurses.find((n) => n.id === selectedId);

  return (
    <MapContainer
      bounds={US_BOUNDS}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {nurses.map((nurse) => (
        <Marker
          key={nurse.id}
          position={[nurse.lat, nurse.lng]}
          icon={pinIcon(nurse.id === selectedId)}
          eventHandlers={{ click: () => onSelect(nurse.id) }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{nurse.name}</p>
              <p>{nurse.hospital}</p>
              <p className="text-white/80">{nurse.unit}</p>
              <p className="text-white/60">
                {nurse.city}, {nurse.state}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      <FlyToSelected nurse={selectedNurse} />
    </MapContainer>
  );
}
