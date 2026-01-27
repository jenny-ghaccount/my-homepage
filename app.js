// This script fetches today's flights from the OpenSky Network API, extracts unique destinations, and allows searching for flights by selected destination.

document.addEventListener('DOMContentLoaded', async () => {

  const datePicker = document.getElementById('date-picker');
  const resultsDiv = document.getElementById('results');
  const searchBtn = document.getElementById('search-btn');
  const statusDiv = document.getElementById('status');


  // Helper to get midnight UTC timestamp for a given date string (yyyy-mm-dd)
  function getMidnightUTC(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z');
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
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


  // Filter flights by date (flights seen today)
  function filterFlightsByDate(states, dateStr) {
    const midnight = getMidnightUTC(dateStr);
    const nextMidnight = midnight + 86400;
    return states.filter(s => s[8] && s[8] >= midnight && s[8] < nextMidnight);
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


  // Set date picker to today by default
  const todayStr = new Date().toISOString().slice(0, 10);
  datePicker.value = todayStr;

  let states = [];
  async function loadFlights() {
    states = await fetchFlights();
    statusDiv.textContent = '';
    resultsDiv.innerHTML = '';
  }

  await loadFlights();

  searchBtn.onclick = () => {
    const dateStr = datePicker.value;
    if (!dateStr) {
      resultsDiv.innerHTML = '<p>Please select a date.</p>';
      return;
    }
    const flights = filterFlightsByDate(states, dateStr);
    renderResults(flights);
  };
});
