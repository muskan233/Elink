
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Vehicle, VehicleStatus } from '../../types';
import ReactDOMServer from 'react-dom/server';

interface VehicleMapProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onVehicleSelect: (id: string) => void;
}

const FlyToVehicle: React.FC<{ vehicle?: Vehicle }> = ({ vehicle }) => {
  const map = useMap();
  useEffect(() => {
    if (vehicle) {
      map.flyTo([vehicle.location.lat, vehicle.location.lng], 15, { duration: 1.2 });
    }
  }, [vehicle, map]);
  return null;
};

const getIcon = (status: string, selected: boolean) => {
  let color = '#94a3b8'; // Offline
  const s = status?.toLowerCase();
  
  if (s === 'on' || s === 'online') color = '#10b981'; // Green
  else if (s === 'idle') color = '#f59e0b'; // Amber
  else if (s === 'off' || s === 'offline') color = '#ef4444'; // Red

  const iconHtml = ReactDOMServer.renderToString(
    <div className={`relative flex items-center justify-center w-7 h-7 rounded-full border-[2px] border-white shadow-xl transition-all duration-300 ${selected ? 'scale-125 ring-4 ring-indigo-500/40' : ''}`} 
         style={{ backgroundColor: color }}>
      <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
      {(s === 'on' || s === 'online') && (
         <span className="absolute inset-[-6px] rounded-full border-2 border-emerald-500/40 animate-ping"></span>
      )}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon', 
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const VehicleMap: React.FC<VehicleMapProps> = ({ vehicles, selectedVehicleId, onVehicleSelect }) => {
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
  const defaultCenter: [number, number] = [22.0, 78.0];

  const getVehicleIcon = (v: Vehicle) => {
    return getIcon(v.status as string, v.id === selectedVehicleId);
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={5} 
      className="w-full h-full z-0" 
      zoomControl={false} 
      maxZoom={18}
      minZoom={4}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FlyToVehicle vehicle={selectedVehicle} />
      
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={true}
      >
        {vehicles.map((vehicle) => {
          if (!vehicle.location?.lat || !vehicle.location?.lng) return null;
          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.location.lat, vehicle.location.lng]}
              icon={getVehicleIcon(vehicle)}
              eventHandlers={{ click: () => onVehicleSelect(vehicle.id) }}
            />
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default VehicleMap;
