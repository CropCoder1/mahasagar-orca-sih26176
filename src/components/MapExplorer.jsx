import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import {
  Anchor,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Fish,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCcw,
  Route,
  Ship,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { pfzZones } from '../data/mockData';
import './MapExplorer.css';

// Preset starting harbours for manual source selection
const STARTING_HARBOURS = [
  { id: 'kochi', name: 'Kochi Harbour', point: [9.9312, 76.2673], isCurrentLocation: true },
  { id: 'munambam', name: 'Munambam Harbour', point: [10.1830, 76.1720], isCurrentLocation: false },
  { id: 'alappuzha', name: 'Alappuzha Port', point: [9.4980, 76.3260], isCurrentLocation: false },
  { id: 'chellanam', name: 'Chellanam Fishing Harbour', point: [9.8050, 76.2750], isCurrentLocation: false }
];

const zoneLocations = {
  1: [9.82, 75.88], // Kochi Deep PFZ (High Fish Shoal 🐟)
  2: [10.12, 75.92], // Vypin Bank PFZ (Active Shoal 🐟)
  3: [9.48, 76.08] // Alappuzha Reef PFZ (Feeding Shoal 🐟)
};

const hazard = [
  [10.22, 75.78],
  [10.32, 75.82],
  [10.28, 75.94],
  [10.18, 75.90]
];

// Production note: In production, international and national boundary geometries
// will be retrieved from Indian Coast Guard / INCOIS / Global Fishing Watch (GFW) GIS endpoints.
// Continuous International Maritime Boundary / Indian EEZ (200 NM) across the whole Arabian Sea
const internationalBoundary = [
  [14.50, 71.60],
  [13.70, 72.00],
  [12.80, 72.40],
  [11.90, 72.80],
  [11.00, 73.20],
  [10.10, 73.60],
  [9.20, 74.05],
  [8.30, 74.55],
  [7.40, 75.15],
  [6.80, 75.75]
];

// Continuous National Territorial Water Limit (12 NM / State Fisheries Border) along the coast
const nationalBoundary = [
  [14.40, 74.05],
  [13.80, 74.28],
  [13.20, 74.55],
  [12.60, 74.82],
  [12.00, 75.05],
  [11.40, 75.38],
  [10.80, 75.68],
  [10.20, 75.92],
  [9.60, 76.12],
  [9.00, 76.35],
  [8.40, 76.68],
  [7.80, 77.20],
  [7.20, 77.65]
];

const INTERNATIONAL_EXPLANATION =
  "India's International Maritime Boundary / Exclusive Economic Zone (EEZ - 200 NM). Crossing into foreign or international high seas requires naval clearance.";

const NATIONAL_EXPLANATION =
  'National Territorial Coastal Water Limit (12 NM). Indian coastal fishing boats have full sovereign rights to fish freely inside this zone.';

function lerpRoute(route, progress) {
  if (!route || route.length === 0) return [9.9312, 76.2673];
  if (route.length === 1 || progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

  const scaled = progress * (route.length - 1);
  const index = Math.min(Math.floor(scaled), route.length - 2);
  const amount = scaled - index;

  return [
    route[index][0] + (route[index + 1][0] - route[index][0]) * amount,
    route[index][1] + (route[index + 1][1] - route[index][1]) * amount
  ];
}

function getTraveledSubpath(fullRoute, progress) {
  if (!fullRoute || fullRoute.length < 2) return [];
  if (progress <= 0) return [fullRoute[0]];
  if (progress >= 1) return fullRoute;

  const scaled = progress * (fullRoute.length - 1);
  const index = Math.min(Math.floor(scaled), fullRoute.length - 2);
  const subpath = fullRoute.slice(0, index + 1);
  subpath.push(lerpRoute(fullRoute, progress));
  return subpath;
}

function getRemainingSubpath(fullRoute, progress) {
  if (!fullRoute || fullRoute.length < 2) return [];
  if (progress <= 0) return fullRoute;
  if (progress >= 1) return [fullRoute[fullRoute.length - 1]];

  const scaled = progress * (fullRoute.length - 1);
  const index = Math.min(Math.floor(scaled), fullRoute.length - 2);
  const currentPt = lerpRoute(fullRoute, progress);
  return [currentPt, ...fullRoute.slice(index + 1)];
}

function computeSafeRoute(fromPoint, toPoint, isDanger) {
  const [fLat, fLng] = fromPoint;
  const [tLat, tLng] = toPoint;

  const midLat = (fLat + tLat) / 2;
  const midLng = (fLng + tLng) / 2;

  // Check if straight line crosses near the hazard zone (around lat 9.96-10.23, lng 76.42-76.68)
  const isNearHazard = isDanger || (midLat >= 9.92 && midLat <= 10.30 && midLng >= 76.32);

  if (isNearHazard) {
    // Route west through safe coastal sea corridor
    const safeWestLng = Math.min(fLng, tLng, 76.12) - 0.05;
    const wp1 = [fLat + (tLat - fLat) * 0.35, safeWestLng];
    const wp2 = [fLat + (tLat - fLat) * 0.70, safeWestLng + 0.02];
    return [fromPoint, wp1, wp2, toPoint];
  }

  // Smooth sea route with natural waypoint
  const safeMidLng = Math.min(fLng, tLng) - 0.035;
  const wp = [midLat, safeMidLng];
  return [fromPoint, wp, toPoint];
}

function ResizeMap({ active }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      const timer = window.setTimeout(() => map.invalidateSize(), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [active, map]);
  return null;
}

function MapClickHandler({ onPick, pickingMode }) {
  useMapEvents({
    click: (event) => onPick(event.latlng, pickingMode)
  });
  return null;
}

export default function MapExplorer({ labels, onRouteStateChange }) {
  // Source (FROM) state
  const [selectedSource, setSelectedSource] = useState(STARTING_HARBOURS[0]);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [mapPickingMode, setMapPickingMode] = useState(null); // null | 'source' | 'destination'

  // Destination (TO) state
  const [destinationId, setDestinationId] = useState('');
  const [customDestination, setCustomDestination] = useState(null);

  // Active Route state
  const [route, setRoute] = useState([]);
  const [returnRoute, setReturnRoute] = useState([]);

  // Trip state machine: 'idle' | 'outbound' | 'arrived' | 'returning' | 'completed'
  const [tripPhase, setTripPhase] = useState('idle');
  const [tripProgress, setTripProgress] = useState(0);
  const [returnProgress, setReturnProgress] = useState(0);

  const [toast, setToast] = useState('');
  const sourceDropdownRef = useRef(null);

  // Close source dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target)) {
        setSourcePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const destination = customDestination || pfzZones.find((zone) => String(zone.id) === destinationId);
  const destinationPoint = destination
    ? customDestination
      ? customDestination.point
      : zoneLocations[destination.id]
    : null;

  // Notify parent of route status for dynamic "Safe route ready" pill
  useEffect(() => {
    if (onRouteStateChange) {
      onRouteStateChange(route.length > 1);
    }
  }, [route, onRouteStateChange]);

  // Outbound trip animation
  useEffect(() => {
    if (tripPhase !== 'outbound' || route.length < 2) return undefined;
    let frame;
    const started = performance.now();
    const duration = 6000;

    const animate = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      setTripProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setTripPhase('arrived');
        setToast(`You've reached ${destination?.name || 'destination'} — safe fishing conditions confirmed.`);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tripPhase, route, destination]);

  // Return trip animation
  useEffect(() => {
    if (tripPhase !== 'returning' || returnRoute.length < 2) return undefined;
    let frame;
    const started = performance.now();
    const duration = 6000;

    const animate = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      setReturnProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setTripPhase('completed');
        setToast(`Trip complete! Safely returned to ${selectedSource.name}.`);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tripPhase, returnRoute, selectedSource]);

  // Find Safe Route handler
  const findRoute = () => {
    if (!destinationPoint) return;
    const safePath = computeSafeRoute(
      selectedSource.point,
      destinationPoint,
      destination?.kind === 'danger'
    );
    setRoute(safePath);

    // Prepare return route (slight offset for clear round-trip log visual distinction)
    const reversed = [...safePath].reverse();
    const offsetReturn = reversed.map((pt, idx) => {
      if (idx === 0 || idx === reversed.length - 1) return pt;
      return [pt[0] - 0.015, pt[1] - 0.02];
    });
    setReturnRoute(offsetReturn);

    setTripPhase('idle');
    setTripProgress(0);
    setReturnProgress(0);
    setToast('');
  };

  // Map Click Handler
  const handleMapClick = ({ lat, lng }) => {
    if (mapPickingMode === 'source') {
      const customSrc = {
        id: 'custom-src',
        name: 'Custom starting point',
        point: [lat, lng],
        isCurrentLocation: false
      };
      setSelectedSource(customSrc);
      setMapPickingMode(null);
      setRoute([]);
      setReturnRoute([]);
      setTripPhase('idle');
      setToast('Starting point set. Now pick a destination.');
      return;
    }

    // Default: Pick custom destination
    const nearHazard = lat > 9.96 && lat < 10.23 && lng > 76.42 && lng < 76.68;
    const distanceKm = Math.max(
      3,
      Math.round(Math.hypot((lat - selectedSource.point[0]) * 111, (lng - selectedSource.point[1]) * 105))
    );

    const picked = {
      id: 'custom',
      name: 'Custom sea point',
      distance: `${distanceKm} km`,
      safety: nearHazard ? 'Hazard alert nearby' : 'Good fishing conditions',
      kind: nearHazard ? 'danger' : 'safe',
      sst: nearHazard ? '27.6 C' : '28.2 C',
      chlorophyll: nearHazard ? 'Low' : 'High',
      point: [lat, lng]
    };

    setCustomDestination(picked);
    setDestinationId('custom');
    setRoute([]);
    setReturnRoute([]);
    setTripPhase('idle');
    setTripProgress(0);
    setReturnProgress(0);

    setToast(
      nearHazard
        ? 'Hazard zone nearby. Tap "Find Safe Route" to chart safe path.'
        : 'Custom destination selected. Tap "Find Safe Route" to draw path.'
    );
  };

  const startTrip = () => {
    if (route.length > 1) {
      setTripPhase('outbound');
      setTripProgress(0);
      setToast('');
    }
  };

  const startReturnTrip = () => {
    if (returnRoute.length > 1) {
      setTripPhase('returning');
      setReturnProgress(0);
      setToast('Returning to harbour along safe navigation corridor...');
    }
  };

  const resetTrip = () => {
    setTripPhase('idle');
    setTripProgress(0);
    setReturnProgress(0);
    setToast('');
  };

  const resetToCurrentLocation = () => {
    setSelectedSource(STARTING_HARBOURS[0]);
    setSourcePickerOpen(false);
    setMapPickingMode(null);
    setRoute([]);
    setReturnRoute([]);
    setTripPhase('idle');
    setToast('Reset starting point to live location: Kochi Harbour.');
  };

  // Traveled subpaths for visual differentiation during trip
  const outboundTraveled = useMemo(() => {
    if (tripPhase === 'idle') return [];
    if (tripPhase === 'outbound') return getTraveledSubpath(route, tripProgress);
    return route; // fully traveled if arrived, returning, or completed
  }, [tripPhase, route, tripProgress]);

  const outboundRemaining = useMemo(() => {
    if (tripPhase === 'outbound') return getRemainingSubpath(route, tripProgress);
    return [];
  }, [tripPhase, route, tripProgress]);

  const returnTraveled = useMemo(() => {
    if (tripPhase === 'returning') return getTraveledSubpath(returnRoute, returnProgress);
    if (tripPhase === 'completed') return returnRoute;
    return [];
  }, [tripPhase, returnRoute, returnProgress]);

  // Current moving boat coordinates
  const currentBoatPosition = useMemo(() => {
    if (tripPhase === 'outbound') return lerpRoute(route, tripProgress);
    if (tripPhase === 'arrived') return destinationPoint || selectedSource.point;
    if (tripPhase === 'returning') return lerpRoute(returnRoute, returnProgress);
    if (tripPhase === 'completed') return selectedSource.point;
    return null;
  }, [tripPhase, route, returnRoute, tripProgress, returnProgress, destinationPoint, selectedSource]);

  const distanceKmNum = destination ? parseFloat(destination.distance) : 15;
  const remainingKm =
    tripPhase === 'outbound'
      ? Math.max(0, Math.round(distanceKmNum * (1 - tripProgress)))
      : tripPhase === 'returning'
      ? Math.max(0, Math.round(distanceKmNum * (1 - returnProgress)))
      : 0;

  return (
    <div className="map-explorer">
      {/* Route Control Panel */}
      <div className="route-panel">
        {/* Source (FROM) Selector */}
        <div className="route-field source-field" ref={sourceDropdownRef}>
          <Anchor size={18} />
          <span>
            <small>FROM</small>
            <strong>{selectedSource.name}</strong>
          </span>

          {selectedSource.isCurrentLocation ? (
            <span className="readonly-tag">Current location</span>
          ) : (
            <button
              className="reset-location-tag"
              onClick={resetToCurrentLocation}
              type="button"
              title="Reset to your live location"
            >
              <LocateFixed size={12} /> Live location
            </button>
          )}

          <button
            className="change-source-btn"
            onClick={() => setSourcePickerOpen((prev) => !prev)}
            type="button"
          >
            Change <ChevronDown size={14} />
          </button>

          {/* Source Selection Popover */}
          {sourcePickerOpen && (
            <div className="source-picker-popover">
              <div className="picker-header">
                <strong>Choose starting harbour</strong>
                <button
                  className="close-picker-btn"
                  onClick={() => setSourcePickerOpen(false)}
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="harbour-list">
                {STARTING_HARBOURS.map((harbour) => (
                  <button
                    key={harbour.id}
                    className={`harbour-item ${selectedSource.id === harbour.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSource(harbour);
                      setSourcePickerOpen(false);
                      setRoute([]);
                      setReturnRoute([]);
                      setTripPhase('idle');
                    }}
                    type="button"
                  >
                    <Anchor size={14} />
                    <span>{harbour.name}</span>
                    {harbour.isCurrentLocation && <small>Live</small>}
                    {selectedSource.id === harbour.id && <Check size={14} className="check-icon" />}
                  </button>
                ))}
              </div>

              <div className="picker-footer">
                <button
                  className="pick-on-map-btn"
                  onClick={() => {
                    setMapPickingMode('source');
                    setSourcePickerOpen(false);
                    setToast('Tap anywhere on the map to set your starting location.');
                  }}
                  type="button"
                >
                  <MapPin size={14} /> Tap starting point on map
                </button>

                {!selectedSource.isCurrentLocation && (
                  <button
                    className="use-live-btn"
                    onClick={resetToCurrentLocation}
                    type="button"
                  >
                    <LocateFixed size={14} /> Reset to live location
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <ArrowRight className="route-arrow" />

        {/* Destination (TO) Selector */}
        <div className="route-field destination-field">
          <Fish size={18} />
          <span>
            <small>TO</small>
            <select
              value={destinationId}
              onChange={(event) => {
                setDestinationId(event.target.value);
                setCustomDestination(null);
                setRoute([]);
                setReturnRoute([]);
                setTripPhase('idle');
              }}
            >
              <option value="">Choose a fishing zone</option>
              {pfzZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} - {zone.distance}
                </option>
              ))}
              {customDestination && (
                <option value="custom">Custom point - {customDestination.distance}</option>
              )}
            </select>
          </span>
        </div>

        {/* Action button */}
        <button
          className="route-button"
          disabled={!destination}
          onClick={findRoute}
          type="button"
        >
          <Route size={17} /> Find Safe Route
        </button>
      </div>

      {/* Picking Mode Notification Banner */}
      {mapPickingMode === 'source' && (
        <div className="picking-mode-banner">
          <MapPin size={16} />
          <span>Tap anywhere on the sea to set your custom starting point</span>
          <button onClick={() => setMapPickingMode(null)} type="button">
            Cancel
          </button>
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div className="leaflet-frame">
        <MapContainer
          className="leaflet-map"
          center={[10.05, 75.85]}
          zoom={9}
          scrollWheelZoom
          zoomControl
          touchZoom
          dragging
        >
          <ResizeMap active />
          <MapClickHandler onPick={handleMapClick} pickingMode={mapPickingMode} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. International Maritime Boundary (Arabian Sea / EEZ 200 NM) */}
          <Polyline
            positions={internationalBoundary}
            pathOptions={{ color: '#7C3AED', weight: 3.5, dashArray: '12 8' }}
          >
            <Tooltip permanent direction="top" className="boundary-pill purple-pill" offset={[0, -5]}>
              <span>International maritime boundary (EEZ 200 NM) ⓘ</span>
            </Tooltip>
            <Popup className="boundary-popup">
              <div className="popup-content">
                <strong>International Maritime Boundary (EEZ)</strong>
                <p>{INTERNATIONAL_EXPLANATION}</p>
                <small>Source: Official Maritime Delimitation / Indian Coast Guard</small>
              </div>
            </Popup>
          </Polyline>

          {/* 2. National Territorial Waters / Coastal Limit (12 NM) */}
          <Polyline
            positions={nationalBoundary}
            pathOptions={{ color: '#0284C7', weight: 3.5, dashArray: '7 7' }}
          >
            <Tooltip permanent direction="top" className="boundary-pill blue-pill" offset={[0, -5]}>
              <span>National coastal limit (12 NM) ⓘ</span>
            </Tooltip>
            <Popup className="boundary-popup">
              <div className="popup-content">
                <strong>National Territorial Coastal Waters (12 NM)</strong>
                <p>{NATIONAL_EXPLANATION}</p>
                <small>Indian Territorial Waters and Fisheries Regulation Zone</small>
              </div>
            </Popup>
          </Polyline>

          {/* Submerged Reef & High Swell Hazard Zone */}
          <Polygon
            positions={hazard}
            pathOptions={{ color: '#DC2626', fillColor: '#EF4444', fillOpacity: 0.32, weight: 2.5, dashArray: '6 4' }}
          >
            <Tooltip>⚠️ Submerged Shoal & Extreme Swell — Restricted passage</Tooltip>
          </Polygon>

          {/* Source Point Marker */}
          <CircleMarker
            center={selectedSource.point}
            radius={9}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#0B3D5C', fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top">
              {selectedSource.name} {selectedSource.isCurrentLocation ? '(Live)' : '(Source)'}
            </Tooltip>
          </CircleMarker>

          {/* Preset PFZ High Fish Density Zones (जहाँ ज्यादा मछली है) */}
          {pfzZones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={zoneLocations[zone.id]}
              radius={24}
              pathOptions={{
                color: '#059669',
                fillColor: '#10B981',
                fillOpacity: 0.38,
                weight: 2.5
              }}
              eventHandlers={{
                click: () => {
                  setDestinationId(String(zone.id));
                  setCustomDestination(null);
                  setRoute([]);
                  setReturnRoute([]);
                  setTripPhase('idle');
                }
              }}
            >
              <Tooltip permanent direction="bottom" className="pfz-marker-tooltip" offset={[0, 10]}>
                <span>🐟 {zone.name.split(' (')[0]} · {zone.density}</span>
              </Tooltip>
              <Popup>
                <div style={{ padding: '6px', fontSize: '13px' }}>
                  <strong style={{ color: '#047857' }}>🐟 {zone.name}</strong>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>
                    <strong>Fish Density:</strong> {zone.density}<br />
                    <strong>Species:</strong> {zone.species}<br />
                    <strong>Chlorophyll:</strong> {zone.chlorophyll}<br />
                    <strong>Sea Temp:</strong> {zone.sst}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Custom Destination Point Marker */}
          {customDestination && (
            <CircleMarker
              center={customDestination.point}
              radius={14}
              pathOptions={{
                color: customDestination.kind === 'danger' ? '#E45757' : '#0E7490',
                fillColor: customDestination.kind === 'danger' ? '#F87171' : '#22D3EE',
                fillOpacity: 0.85,
                weight: 3
              }}
            >
              <Popup>
                <strong>{customDestination.name}</strong>
                <br />
                SST {customDestination.sst} · Chlorophyll {customDestination.chlorophyll}
                <br />
                {customDestination.safety}
              </Popup>
            </CircleMarker>
          )}

          {/* ROUTE DRAWING (Fix 2 & Fix 4) */}
          {/* A. Idle Mode: Planned Route Line */}
          {tripPhase === 'idle' && route.length > 1 && (
            <Polyline
              positions={route}
              pathOptions={{ color: '#0E7490', weight: 5, dashArray: '10 7' }}
            >
              <Tooltip sticky>Safe planned route to {destination?.name}</Tooltip>
            </Polyline>
          )}

          {/* B. Outbound Trip: Traveled Solid Trail + Remaining Dashed Ahead */}
          {tripPhase === 'outbound' && (
            <>
              {outboundTraveled.length > 1 && (
                <Polyline
                  positions={outboundTraveled}
                  pathOptions={{ color: '#0E7490', weight: 5 }}
                />
              )}
              {outboundRemaining.length > 1 && (
                <Polyline
                  positions={outboundRemaining}
                  pathOptions={{ color: '#94A3B8', weight: 4, dashArray: '6 6' }}
                />
              )}
            </>
          )}

          {/* C. Arrived: Full Outbound Traveled Trail */}
          {(tripPhase === 'arrived' || tripPhase === 'returning' || tripPhase === 'completed') && (
            <Polyline
              positions={route}
              pathOptions={{
                color: '#0E7490',
                weight: 4.5,
                opacity: tripPhase === 'completed' ? 0.75 : 1
              }}
            >
              <Tooltip sticky>Outbound journey · {destination?.distance}</Tooltip>
            </Polyline>
          )}

          {/* D. Returning / Completed: Return Trail (Visually Distinct Amber Dashed) */}
          {returnTraveled.length > 1 && (
            <Polyline
              positions={returnTraveled}
              pathOptions={{ color: '#F59E0B', weight: 4.5, dashArray: '8 6' }}
            >
              <Tooltip sticky>Return journey to {selectedSource.name}</Tooltip>
            </Polyline>
          )}

          {/* Boat Marker */}
          {currentBoatPosition && (
            <CircleMarker
              center={currentBoatPosition}
              radius={10}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#0B3D5C', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="right">
                {tripPhase === 'outbound' && `En route to zone · ${remainingKm} km left`}
                {tripPhase === 'arrived' && `Arrived at ${destination?.name}`}
                {tripPhase === 'returning' && `Returning to harbour · ${remainingKm} km left`}
                {tripPhase === 'completed' && `Returned safely to ${selectedSource.name}`}
              </Tooltip>
            </CircleMarker>
          )}
        </MapContainer>

        {/* Floating Trip Status Pill */}
        {tripPhase !== 'idle' && (
          <div className="trip-floating">
            <Ship size={16} />
            {tripPhase === 'outbound' && `Outbound: ${remainingKm} km to destination`}
            {tripPhase === 'arrived' && `Arrived at ${destination?.name}`}
            {tripPhase === 'returning' && `Returning: ${remainingKm} km to ${selectedSource.name}`}
            {tripPhase === 'completed' && `Round trip complete`}
          </div>
        )}

        {/* Map Legend */}
        <div className="map-legend leaflet-legend">
          <span><i className="green" /> High Fish Density (PFZ 🐟)</span>
          <span title="Click line on map for legal explanation"><i className="blue" /> National Coastal Limit (12 NM)</span>
          <span title="Click line on map for legal explanation"><i className="purple" /> International Boundary (EEZ 200 NM)</span>
          <span><i className="red" /> Submerged Hazard Shoal</span>
          {tripPhase !== 'idle' && (
            <>
              <span className="legend-divider">|</span>
              <span><i className="teal" /> Outbound</span>
              {(tripPhase === 'returning' || tripPhase === 'completed') && (
                <span><i className="amber" /> Return</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Route Summary Card & Trip Controls */}
      {route.length > 1 && (
        <div className="route-summary">
          <div>
            <Route size={20} />
            <span>
              <small>SAFE ROUTE</small>
              <strong>
                {destination?.distance || '18 km'} ·{' '}
                {tripPhase === 'arrived'
                  ? 'Arrived at Destination'
                  : tripPhase === 'returning'
                  ? 'Returning to Port'
                  : tripPhase === 'completed'
                  ? 'Round Trip Completed'
                  : 'Approx. 35 min'}
              </strong>
            </span>
          </div>

          <p>
            {destination?.kind === 'danger'
              ? 'Route diverted via safe western deep-water corridor to avoid coastal high-wave hazard.'
              : 'Safe sea route clear of shallow shoals and hazard zones.'}
          </p>

          <div className="trip-actions">
            {tripPhase === 'idle' && (
              <button className="trip-button" onClick={startTrip} type="button">
                <Ship size={17} /> Start Trip
              </button>
            )}

            {tripPhase === 'outbound' && (
              <button className="trip-button cancel" onClick={resetTrip} type="button">
                <X size={17} /> Cancel Trip
              </button>
            )}

            {tripPhase === 'arrived' && (
              <button className="trip-button return-btn" onClick={startReturnTrip} type="button">
                <RotateCcw size={17} /> Return to Harbour
              </button>
            )}

            {tripPhase === 'returning' && (
              <button className="trip-button cancel" onClick={resetTrip} type="button">
                <X size={17} /> Cancel Return
              </button>
            )}

            {tripPhase === 'completed' && (
              <button className="trip-button new-trip-btn" onClick={resetTrip} type="button">
                <CheckCircle2 size={17} /> Plan New Route
              </button>
            )}
          </div>
        </div>
      )}

      {/* Arrival / Notification Toast */}
      {toast && (
        <motion.div
          className="arrival-toast"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LocateFixed size={18} />
          <span>{toast}</span>
          <button className="toast-close" onClick={() => setToast('')} type="button">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
