// This script fetches today's flights from the OpenSky Network API, extracts unique destinations, and allows searching for flights by selected destination.

document.addEventListener('DOMContentLoaded', async () => {
  const dropdown = document.getElementById('destination-dropdown');
  const resultsDiv = document.getElementById('results');
  const searchBtn = document.getElementById('search-btn');
  const statusDiv = document.getElementById('status');

  // Helper to get today's midnight UTC timestamp
  function getTodayMidnightUTC() {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000;
  }

  // Fetch all states from OpenSky API
  async function fetchFlights() {
    statusDiv.textContent = 'Loading flight data...';
    try {
      const response = await fetch('https://opensky-network.org/api/states/all');
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data.states || [];
    } catch (e) {
      statusDiv.textContent = 'Failed to load flight data.';
      return [];
    }
  }

  // Extract unique destinations for today
  function getDestinations(states) {
    const today = getTodayMidnightUTC();
    const destinations = new Set();
    states.forEach(s => {
      // s[8] = lastSeen (timestamp), s[12] = destination airport
      if (s[8] && s[8] >= today && s[12]) {
        destinations.add(s[12]);
      }
    });
    return Array.from(destinations).sort();
  }

  // Filter flights by destination
  function filterFlights(states, dest) {
    const today = getTodayMidnightUTC();
    return states.filter(s => s[8] && s[8] >= today && s[12] === dest);
  }

  // Get airline name from callsign (simple heuristic)
  function getAirlineName(callsign) {
    if (!callsign) return 'Unknown';
    // Example: "DLH" for Lufthansa, "BAW" for British Airways, etc.
    const airlineCodes = {
      'DLH': 'Lufthansa',
      'BAW': 'British Airways',
      'AFR': 'Air France',
      'KLM': 'KLM',
      'AAL': 'American Airlines',
      'UAL': 'United Airlines',
      'SWR': 'Swiss',
      'RYR': 'Ryanair',
      'EZY': 'easyJet',
      'WZZ': 'Wizz Air',
      'SAS': 'Scandinavian Airlines',
      'TAP': 'TAP Air Portugal',
      'IBE': 'Iberia',
      'QTR': 'Qatar Airways',
      'THY': 'Turkish Airlines',
      'DLR': 'German Aerospace Center',
      // Add more as needed
    };
    const code = callsign.slice(0, 3).toUpperCase();
    return airlineCodes[code] || code;
  }

  // Render results
  function renderResults(flights) {
    if (!flights.length) {
      resultsDiv.innerHTML = '<p>No flights found for this destination today.</p>';
      return;
    }
    resultsDiv.innerHTML = '<table><thead><tr><th>Airline</th><th>Callsign</th><th>From</th></tr></thead><tbody>' +
      flights.map(f => `<tr><td>${getAirlineName(f[1])}</td><td>${f[1] || 'N/A'}</td><td>${f[2] || 'N/A'}</td></tr>`).join('') +
      '</tbody></table>';
  }

  // Main logic
  const states = await fetchFlights();
  if (!states.length) return;
  statusDiv.textContent = '';
  const destinations = getDestinations(states);
  dropdown.innerHTML = '<option value="">Select destination</option>' +
    destinations.map(d => `<option value="${d}">${d}</option>`).join('');

  searchBtn.onclick = () => {
    const dest = dropdown.value;
    if (!dest) {
      resultsDiv.innerHTML = '<p>Please select a destination.</p>';
      return;
    }
    const flights = filterFlights(states, dest);
    renderResults(flights);
  };
});
