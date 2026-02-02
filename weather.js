// Weather module using Open-Meteo API
const WeatherApp = {
    // Configuration
    config: {
        // Default location (London)
        defaultLat: 51.5074,
        defaultLon: -0.1278,
        defaultCity: 'London, UK',
        
        // API endpoints
        weatherAPI: 'https://api.open-meteo.com/v1/forecast',
        geocodingAPI: 'https://geocoding-api.open-meteo.com/v1/search'
    },

    // European cities for dropdown selection
    europeanCities: {
        'london': { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
        'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris, France' },
        'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin, Germany' },
        'madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid, Spain' },
        'rome': { lat: 41.9028, lon: 12.4964, name: 'Rome, Italy' },
        'amsterdam': { lat: 52.3676, lon: 4.9041, name: 'Amsterdam, Netherlands' },
        'vienna': { lat: 48.2082, lon: 16.3738, name: 'Vienna, Austria' },
        'stockholm': { lat: 59.3293, lon: 18.0686, name: 'Stockholm, Sweden' },
        'copenhagen': { lat: 55.6761, lon: 12.5683, name: 'Copenhagen, Denmark' },
        'zurich': { lat: 47.3769, lon: 8.5417, name: 'Zurich, Switzerland' }
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
        this.setupCitySelector();
        this.loadWeather();
        // Optionally, refresh weather every 30 minutes
        setInterval(() => this.loadWeather(), 30 * 60 * 1000);
    },

    // Setup city selector dropdown
    setupCitySelector() {
        const container = document.getElementById('weather-widget');
        const selectorHTML = `
            <div class="city-selector">
                <select id="city-dropdown">
                    ${Object.entries(this.europeanCities).map(([key, city]) => 
                        `<option value="${key}" ${key === 'london' ? 'selected' : ''}>${city.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="weather-content">
                <div class="weather-loading">Loading weather...</div>
            </div>
        `;
        
        container.innerHTML = selectorHTML;
        
        // Add event listener for city selection
        document.getElementById('city-dropdown').addEventListener('change', (e) => {
            this.loadWeatherForCity(e.target.value);
        });
    },

    // Load weather for specific city
    async loadWeatherForCity(cityKey) {
        const city = this.europeanCities[cityKey];
        if (!city) return;
        
        const container = document.querySelector('.weather-content');
        container.innerHTML = '<div class="weather-loading">Loading weather...</div>';
        
        try {
            const weatherData = await this.fetchWeather(city.lat, city.lon);
            this.displayWeather(weatherData, city.name, container);
        } catch (error) {
            console.error('Weather loading error:', error);
            container.innerHTML = `
                <div class="weather-error">
                    Unable to load weather data. Please try again later.
                </div>
            `;
        }
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
            temperature_unit: 'celsius',
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
        // Load default city (London) on initial load
        this.loadWeatherForCity('london');
    },

    // Display weather data
    displayWeather(data, cityName, container = null) {
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
        
        const targetContainer = container || document.querySelector('.weather-content');
        if (targetContainer) {
            targetContainer.innerHTML = html;
        }
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