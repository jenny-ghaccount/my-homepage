# Tech Brief: Implementing Open-Meteo Weather API

## Overview
Open-Meteo is a free, open-source weather API that requires no authentication, making it perfect for client-side implementations. It provides accurate weather data from various national weather services.

## Key Advantages
- **No API key required** - No registration needed
- **No rate limits** for non-commercial use
- **CORS-enabled** - Works directly from browser
- **Multiple data sources** - NOAA, DWD, ECMWF, and more
- **Extensive data** - Current, hourly, and daily forecasts up to 16 days

## API Capabilities
- Current weather conditions
- Hourly forecasts (up to 16 days)
- Daily forecasts (up to 16 days)
- Historical weather data
- Air quality data
- Marine weather
- Multiple units support (metric/imperial)

## Technical Requirements
- Modern browser with JavaScript enabled
- Basic HTML/CSS/JavaScript knowledge
- Internet connection for API calls

---

# Step-by-Step Implementation Plan

## Step 1: Create HTML Structure

Create a section in your HTML file for the weather display:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Weather Site</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Your existing content -->
    
    <!-- Weather Widget Section -->
    <div id="weather-widget" class="weather-container">
        <div class="weather-loading">Loading weather...</div>
    </div>
    
    <script src="weather.js"></script>
</body>
</html>
```

## Step 2: Add CSS Styling

Add these styles to your CSS file:

```css
/* Weather Widget Styles */
.weather-container {
    max-width: 400px;
    margin: 20px auto;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    color: white;
    font-family: Arial, sans-serif;
}

.weather-header {
    text-align: center;
    margin-bottom: 20px;
}

.weather-location {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
}

.weather-date {
    font-size: 14px;
    opacity: 0.8;
}

.weather-current {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20px;
}

.weather-temp {
    font-size: 48px;
    font-weight: bold;
}

.weather-condition {
    text-align: center;
}

.weather-icon {
    font-size: 64px;
    margin-bottom: 10px;
}

.weather-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.weather-detail {
    background: rgba(255,255,255,0.1);
    padding: 10px;
    border-radius: 10px;
    text-align: center;
}

.detail-label {
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 5px;
}

.detail-value {
    font-size: 18px;
    font-weight: bold;
}

.weather-loading, .weather-error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
}

.weather-error {
    color: #ff6b6b;
    background: rgba(255,255,255,0.9);
    border-radius: 10px;
}
```

## Step 3: Create JavaScript Weather Module

Create a `weather.js` file:

```javascript
// Weather module using Open-Meteo API
const WeatherApp = {
    // Configuration
    config: {
        // Default location (Seattle)
        defaultLat: 47.6062,
        defaultLon: -122.3321,
        defaultCity: 'Seattle, WA',
        
        // API endpoints
        weatherAPI: 'https://api.open-meteo.com/v1/forecast',
        geocodingAPI: 'https://geocoding-api.open-meteo.com/v1/search'
    },

    // Weather condition codes to icons and descriptions
    weatherCodes: {
        0: { icon: '☀️', description: 'Clear sky' },
        1: { icon: '🌤️', description: 'Mainly clear' },
        2: { icon: '⛅', description: 'Partly cloudy' },
        3: { icon: '☁️', description: 'Overcast' },
        45: { icon: '🌫️', description: 'Foggy' },
        48: { icon: '🌫️', description: 'Depositing rime fog' },
        51: { icon: '🌦️', description: 'Light drizzle' },
        53: { icon: '🌦️', description: 'Moderate drizzle' },
        55: { icon: '🌦️', description: 'Dense drizzle' },
        61: { icon: '🌧️', description: 'Slight rain' },
        63: { icon: '🌧️', description: 'Moderate rain' },
        65: { icon: '🌧️', description: 'Heavy rain' },
        71: { icon: '🌨️', description: 'Slight snow' },
        73: { icon: '🌨️', description: 'Moderate snow' },
        75: { icon: '🌨️', description: 'Heavy snow' },
        77: { icon: '🌨️', description: 'Snow grains' },
        80: { icon: '🌦️', description: 'Slight rain showers' },
        81: { icon: '🌦️', description: 'Moderate rain showers' },
        82: { icon: '🌧️', description: 'Violent rain showers' },
        85: { icon: '🌨️', description: 'Slight snow showers' },
        86: { icon: '🌨️', description: 'Heavy snow showers' },
        95: { icon: '⛈️', description: 'Thunderstorm' },
        96: { icon: '⛈️', description: 'Thunderstorm with slight hail' },
        99: { icon: '⛈️', description: 'Thunderstorm with heavy hail' }
    },

    // Initialize the weather app
    init() {
        this.loadWeather();
        // Optionally, refresh weather every 30 minutes
        setInterval(() => this.loadWeather(), 30 * 60 * 1000);
    },

    // Get user's location
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                resolve({ 
                    lat: this.config.defaultLat, 
                    lon: this.config.defaultLon,
                    city: this.config.defaultCity 
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const city = await this.getCityName(lat, lon);
                    resolve({ lat, lon, city });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    resolve({ 
                        lat: this.config.defaultLat, 
                        lon: this.config.defaultLon,
                        city: this.config.defaultCity 
                    });
                }
            );
        });
    },

    // Get city name from coordinates (optional)
    async getCityName(lat, lon) {
        try {
            const response = await fetch(
                `${this.config.geocodingAPI}?name=${lat},${lon}&count=1&language=en&format=json`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return `${result.name}, ${result.admin1 || result.country}`;
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        return 'Unknown Location';
    },

    // Fetch weather data
    async fetchWeather(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
            hourly: 'temperature_2m,weather_code',
            daily: 'temperature_2m_max,temperature_2m_min,weather_code',
            temperature_unit: 'fahrenheit',
            wind_speed_unit: 'mph',
            precipitation_unit: 'inch',
            timezone: 'America/Los_Angeles'
        });

        const response = await fetch(`${this.config.weatherAPI}?${params}`);
        if (!response.ok) {
            throw new Error('Weather data fetch failed');
        }
        return await response.json();
    },

    // Load and display weather
    async loadWeather() {
        const container = document.getElementById('weather-widget');
        
        try {
            // Get location
            const location = await this.getUserLocation();
            
            // Fetch weather
            const weatherData = await this.fetchWeather(location.lat, location.lon);
            
            // Display weather
            this.displayWeather(weatherData, location.city);
            
        } catch (error) {
            console.error('Weather loading error:', error);
            container.innerHTML = `
                <div class="weather-error">
                    Unable to load weather data. Please try again later.
                </div>
            `;
        }
    },

    // Display weather data
    displayWeather(data, cityName) {
        const current = data.current;
        const weatherCode = this.weatherCodes[current.weather_code] || 
                          { icon: '❓', description: 'Unknown' };
        
        const html = `
            <div class="weather-header">
                <div class="weather-location">${cityName}</div>
                <div class="weather-date">${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
            </div>
            
            <div class="weather-current">
                <div class="weather-temp">${Math.round(current.temperature_2m)}°</div>
                <div class="weather-condition">
                    <div class="weather-icon">${weatherCode.icon}</div>
                    <div>${weatherCode.description}</div>
                </div>
            </div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="detail-label">Feels Like</div>
                    <div class="detail-value">${Math.round(current.apparent_temperature)}°</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${current.relative_humidity_2m}%</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${Math.round(current.wind_speed_10m)} mph</div>
                </div>
                <div class="weather-detail">
                    <div class="detail-label">Wind Direction</div>
                    <div class="detail-value">${this.getWindDirection(current.wind_direction_10m)}</div>
                </div>
            </div>
        `;
        
        document.getElementById('weather-widget').innerHTML = html;
    },

    // Convert wind direction degrees to compass direction
    getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    WeatherApp.init();
});
```

## Step 4: Test Locally

1. Open your HTML file in a browser
2. Check browser console for any errors
3. Test with location permissions enabled and disabled
4. Verify the weather data displays correctly

## Step 5: Deploy to Vercel

1. Commit your changes to Git
2. Push to your repository
3. Vercel will automatically deploy the changes

## Step 6: Optional Enhancements

Add these features as needed:

```javascript
// Add forecast display
async function displayForecast(data) {
    const daily = data.daily;
    let forecastHTML = '<div class="forecast-container">';
    
    for (let i = 1; i <= 5; i++) {
        const date = new Date(daily.time[i]);
        const weatherCode = WeatherApp.weatherCodes[daily.weather_code[i]];
        
        forecastHTML += `
            <div class="forecast-day">
                <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="forecast-icon">${weatherCode.icon}</div>
                <div class="forecast-temps">
                    <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                    <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
                </div>
            </div>
        `;
    }
    
    forecastHTML += '</div>';
    return forecastHTML;
}

// Add city search
function addCitySearch() {
    const searchHTML = `
        <input type="text" id="city-search" placeholder="Search city...">
        <button onclick="searchCity()">Search</button>
    `;
    // Add to your weather widget
}
```

## Troubleshooting

- **CORS errors**: Open-Meteo is CORS-enabled, but ensure you're using HTTPS in production
- **Location denied**: Falls back to default location (Seattle)
- **No data**: Check network tab for API response

This implementation is completely free, requires no API keys, and will work reliably on your Vercel-hosted site!