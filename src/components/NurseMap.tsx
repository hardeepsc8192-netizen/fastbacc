"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { MarkerCluster } from "leaflet";
import type { Nurse } from "@/lib/types";

// Continental US bounding box — the map's default scope.
const US_BOUNDS: [[number, number], [number, number]] = [
  [24.5, -125],
  [49.5, -66.9],
];

type LocationGroup = {
  key: string;
  lat: number;
  lng: number;
  nurses: Nurse[];
};

function groupByLocation(nurses: Nurse[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  for (const nurse of nurses) {
    const key = `${nurse.lat.toFixed(5)},${nurse.lng.toFixed(5)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.nurses.push(nurse);
    } else {
      groups.set(key, { key, lat: nurse.lat, lng: nurse.lng, nurses: [nurse] });
    }
  }
  return [...groups.values()];
}

function pinIcon(highlighted: boolean, count: number) {
  const fill = highlighted ? "#FFB81C" : "#154734";
  const accent = highlighted ? "#154734" : "#FFB81C";

  if (count > 1) {
    const size = highlighted ? 36 : 30;
    return L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2px solid ${accent};display:flex;align-items:center;justify-content:center;color:${accent};font-weight:700;font-size:${Math.round(
        size * 0.42
      )}px;font-family:sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  const size = highlighted ? 34 : 26;
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

// Clusters different hospitals/cities that are close together on screen —
// separate from groupByLocation, which only merges exact same-address pins.
function clusterIcon(cluster: MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 25 ? 42 : 50;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#154734;border:3px solid #FFB81C;display:flex;align-items:center;justify-content:center;color:#FFB81C;font-weight:700;font-family:sans-serif;font-size:${Math.round(
      size * 0.38
    )}px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${count}</div>`,
    iconSize: L.point(size, size, true),
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
  const groups = groupByLocation(nurses);

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
      <MarkerClusterGroup
        iconCreateFunction={clusterIcon}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={50}
      >
        {groups.map((group) => {
          const isSelected = group.nurses.some((n) => n.id === selectedId);
          const single = group.nurses.length === 1 ? group.nurses[0] : null;

          return (
            <Marker
              key={group.key}
              position={[group.lat, group.lng]}
              icon={pinIcon(isSelected, group.nurses.length)}
              eventHandlers={
                single ? { click: () => onSelect(single.id) } : undefined
              }
            >
              <Popup>
                {single ? (
                  <div className="text-sm">
                    <p className="font-semibold">{single.name}</p>
                    <p>{single.hospital}</p>
                    <p className="text-white/80">{single.unit}</p>
                    <p className="text-white/60">{single.hospitalAddress}</p>
                  </div>
                ) : (
                  <div className="text-sm min-w-[10rem]">
                    <p className="font-semibold mb-1">
                      {group.nurses.length} nurses at {group.nurses[0].hospital}
                    </p>
                    <ul className="space-y-1.5">
                      {group.nurses.map((nurse) => (
                        <li key={nurse.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(nurse.id)}
                            className="text-baylor-gold underline underline-offset-2 hover:text-white"
                          >
                            {nurse.name}
                          </button>
                          <span className="text-white/70"> — {nurse.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
      <FlyToSelected nurse={selectedNurse} />
    </MapContainer>
  );
}
