'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './DigoMap.module.css';

type Settlement = {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  digoSignificance?: string;
  type?: string;
};

type MapProps = {
  settlements: Settlement[];
};

const CENTER: [number, number] = [-4.55, 39.35];
const ZOOM = 9;
const BOUNDS: [[number, number], [number, number]] = [
  [-3.95, 38.85],
  [-5.3, 39.75],
];

const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const COLORS: Record<string, string> = {
  kenya: '#2D3778',
  tanzania: '#B8860B',
  kaya: '#2E7D32',
};

function FitBounds() {
  const map = useMap();
  useMemo(() => {
    map.fitBounds(BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
}

function MapContent({ settlements }: MapProps) {
  return (
    <>
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <FitBounds />
      {settlements.map((s) => {
        const isKaya = s.type === 'kaya';
        const color =
          isKaya
            ? COLORS.kaya
            : s.country === 'Kenya'
              ? COLORS.kenya
              : COLORS.tanzania;

        return (
          <CircleMarker
            key={s.id}
            center={[s.coordinates.lat, s.coordinates.lng]}
            radius={isKaya ? 7 : 5}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: '#fff',
              weight: 1.5,
            }}
          >
            <Popup>
              <div className={styles.popup}>
                <p className={styles.popupName}>{s.name}</p>
                <p className={styles.popupCountry}>{s.country}</p>
                {s.digoSignificance && (
                  <p className={styles.popupSignificance}>
                    {s.digoSignificance}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export function DigoMap({ settlements }: MapProps) {
  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        scrollWheelZoom={false}
        attributionControl={false}
        className={styles.map}
      >
        <MapContent settlements={settlements} />
      </MapContainer>
    </div>
  );
}
