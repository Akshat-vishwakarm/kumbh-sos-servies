import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '@shared/schema';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Icons
const createIcon = (color: string) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const icons = {
  medical: createIcon('#EF4444'), // Red
  lost_self: createIcon('#A855F7'), // Purple
  lost_other: createIcon('#EAB308'), // Yellow
  volunteer: createIcon('#22C55E'), // Green
};

// Component to handle map centering
function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

interface MapProps {
  reports?: Report[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

export default function Map({ reports = [], center, zoom = 15, interactive = true }: MapProps) {
  // Default to Kumbh Mela location (approx) if no center
  const defaultCenter: [number, number] = center || [25.4358, 81.8463]; 

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border/50 bg-slate-100">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />

        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.lat, report.lng]}
            icon={icons[report.type as keyof typeof icons] || icons.volunteer}
          >
            <Popup className="rounded-xl overflow-hidden">
              <div className="p-1 min-w-[200px]">
                <strong className="block text-lg font-display mb-1 capitalize">
                  {report.type.replace('_', ' ')}
                </strong>
                {report.photoUrl && (
                  <img src={report.photoUrl} className="w-full h-32 object-cover rounded-lg mb-2" alt="Report" />
                )}
                <p className="text-sm text-gray-600 mb-1">{report.description || 'No details provided'}</p>
                <div className="text-xs text-gray-400">
                  {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
