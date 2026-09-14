export const alerts = [
  { id: 1, type: 'Cyclone watch', title: 'Strong winds near Lakshadweep', detail: 'Avoid open water after 6 PM. Secure nets before leaving.', time: 'Valid until 18:00 today', severity: 'critical', icon: 'wind' },
  { id: 2, type: 'Wave conditions', title: 'Waves rising to 2.4 m', detail: 'Travel slowly and wear your life jacket beyond the harbour.', time: 'Valid until tomorrow 09:00', severity: 'warning', icon: 'waves' },
  { id: 3, type: 'Lightning', title: 'Lightning possible offshore', detail: 'Return to shore if you see dark clouds or hear thunder.', time: 'Valid until 15:30 today', severity: 'warning', icon: 'zap' }
];

export const forecast = [
  { day: 'Now', temp: 29, wave: 1.1, wind: 13 },
  { day: '10 AM', temp: 30, wave: 1.4, wind: 15 },
  { day: '1 PM', temp: 31, wave: 1.8, wind: 18 },
  { day: '4 PM', temp: 30, wave: 2.4, wind: 24 },
  { day: '7 PM', temp: 28, wave: 2.1, wind: 21 }
];

export const safetyFactors = [
  { icon: 'wind', label: 'Wind', value: '13 km/h', status: 'Calm', tone: 'safe' },
  { icon: 'waves', label: 'Waves', value: '1.1 m', status: 'Safe', tone: 'safe' },
  { icon: 'weather', label: 'Weather', value: 'Partly cloudy', status: 'No rain expected', tone: 'safe' },
  { icon: 'storm', label: 'Cyclone / storm', value: 'Watch 60 km away', status: 'Not near you', tone: 'caution' },
  { icon: 'tide', label: 'Tide', value: 'Low tide at 6 PM', status: 'Plan return early', tone: 'caution' }
];

export const pfzZones = [
  { 
    id: 1, 
    name: 'Kochi Deep PFZ (High Fish Shoal 🐟)', 
    density: '94% Catch Probability',
    species: 'Yellowfin Tuna, Indian Mackerel',
    x: 62, 
    y: 63, 
    sst: '28.2°C', 
    chlorophyll: '2.3 mg/m³ (Plankton Bloom)', 
    distance: '38 km', 
    safety: 'High Fish Aggregation · Safe Seas', 
    kind: 'safe' 
  },
  { 
    id: 2, 
    name: 'Vypin Bank PFZ (Active Shoal 🐟)', 
    density: '89% Catch Probability',
    species: 'Oil Sardines, Anchovies',
    x: 47, 
    y: 34, 
    sst: '28.5°C', 
    chlorophyll: '1.9 mg/m³ (Thermal Front)', 
    distance: '24 km', 
    safety: 'High Schooling Activity', 
    kind: 'safe' 
  },
  { 
    id: 3, 
    name: 'Alappuzha Reef PFZ (Feeding Shoal 🐟)', 
    density: '86% Catch Probability',
    species: 'Seer Fish, Trevally',
    x: 55, 
    y: 72, 
    sst: '28.4°C', 
    chlorophyll: '1.8 mg/m³ (Upwelling Zone)', 
    distance: '28 km', 
    safety: 'Optimal Pelagic Catch Zone', 
    kind: 'safe' 
  }
];

export const vessels = [
  { id: 1, name: 'Sea Star 04', x: 29, y: 44, status: 'Nearby' },
  { id: 2, name: 'Coast Guard 12', x: 76, y: 61, status: 'Ready' },
  { id: 3, name: 'Matsya Mitra', x: 54, y: 76, status: 'Nearby' }
];

export const questions = ['Nearest fishing zone?', 'Safe to sail tomorrow?', 'Any cyclone alert?', 'Show weather'];

export const answers = {
  'Nearest fishing zone?': { text: 'The nearest good fishing zone is Vypin channel, about 8 km from you. Chlorophyll is medium and boat traffic needs care.', title: 'Nearest PFZ found', value: '8 km', chart: false },
  'Safe to sail tomorrow?': { text: 'Sailing is okay in the morning, but return before 4 PM. Waves may rise to 2.4 m and winds become stronger.', title: 'Morning is safest', value: 'Before 4 PM', chart: true },
  'Any cyclone alert?': { text: 'There is a strong-wind watch near Lakshadweep. Stay close to shore and avoid open water after 6 PM.', title: 'Caution offshore', value: 'Until 6 PM', chart: false },
  'Show weather': { text: 'Today is warm with light rain possible. The sea is calm now, but waves build through the afternoon.', title: 'Sea today', value: '1.1 m now', chart: true }
};

export const agents = [
  ['User Interaction', 'Message received'], ['Planning & Orchestration', 'Choosing specialists'], ['Marine Data Discovery', 'Finding local data'], ['Weather Intelligence', 'Reading forecast'], ['Ocean Analytics', 'Checking waves & SST'], ['Geospatial Reasoning', 'Finding safe zones'], ['Risk Assessment', 'Scoring safety'], ['SOS Coordination', 'Checking nearby help'], ['Visualization', 'Preparing map'], ['Reporting & Synthesis', 'Writing clear answer']
];
