const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.get('/api/flights', async (req, res) => {
  try {
    const response = await fetch('https://opensky-network.org/api/states/all');
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const first10 = (data.states || []).slice(0, 10);
    const tempPath = path.join(__dirname, 'flights_temp.json');
    fs.writeFileSync(tempPath, JSON.stringify(first10, null, 2));
    res.json(first10);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch flight data.' });
  }
});

app.get('/api/flights/temp', (req, res) => {
  const tempPath = path.join(__dirname, 'flights_temp.json');
  if (fs.existsSync(tempPath)) {
    res.sendFile(tempPath);
  } else {
    res.status(404).json({ error: 'No temp file found.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
