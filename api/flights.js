import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://opensky-network.org/api/states/all');
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const first10 = (data.states || []).slice(0, 10);
    res.status(200).json(first10);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch flight data.' });
  }
}
