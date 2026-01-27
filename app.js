// This script fetches today's flights from the OpenSky Network API, extracts unique destinations, and allows searching for flights by selected destination.

document.addEventListener('DOMContentLoaded', async () => {

  const datePicker = document.getElementById('date-picker');
  const resultsDiv = document.getElementById('results');
  const searchBtn = document.getElementById('search-btn');
  const statusDiv = document.getElementById('status');


  // Helper to get midnight UTC timestamp for a given date string (yyyy-mm-dd)
  // Fetch all states from OpenSky API
  async function fetchFlights() {
    statusDiv.textContent = 'Loading flight data...';
    const corsProxy = 'https://corsproxy.io/?';
    const apiUrl = 'https://opensky-network.org/api/states/all';
    try {
      const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data.states || [];
    } catch (e) {
      statusDiv.textContent = 'Failed to load flight data.';
      return [];
    }
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

    // Render results for the first 10 flights
    function renderResults(flights) {
      if (!flights.length) {
        resultsDiv.innerHTML = '<p>No flights found.</p>';
        return;
      }
      resultsDiv.innerHTML = '<table><thead><tr><th>Airline</th><th>Callsign</th><th>From</th><th>Status</th></tr></thead><tbody>' +
        flights.slice(0, 10).map(f => `<tr><td>${getAirlineName(f[1])}</td><td>${f[1] || 'N/A'}</td><td>${f[2] || 'N/A'}</td><td>${f[8] ? (f[9] ? 'On Ground' : 'In Air') : 'Unknown'}</td></tr>`).join('') +
        '</tbody></table>';
    }


    searchBtn.onclick = async () => {
      statusDiv.textContent = 'Loading flight data...';
      const states = await fetchFlights();
      statusDiv.textContent = '';
      renderResults(states);
    };
  };
});
