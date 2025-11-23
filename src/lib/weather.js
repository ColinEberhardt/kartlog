// src/lib/weather.js
// Shared weather fetch logic for sessions

export async function fetchWeatherForSession({ circuitId, date, tracks }) {
  if (!circuitId) {
    throw new Error('Please select a track first');
  }
  if (!date) {
    throw new Error('Please select a date and time first');
  }
  const selectedTrack = tracks.find(t => t.id === circuitId);
  if (!selectedTrack || !selectedTrack.latitude || !selectedTrack.longitude) {
    throw new Error('Selected track does not have location data');
  }
  const sessionDate = new Date(date);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let response;
  let weatherData;
  if (sessionDate < hourAgo) {
    // Historical weather
    const dateStr = sessionDate.toISOString().split('T')[0];
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${selectedTrack.latitude}&longitude=${selectedTrack.longitude}&start_date=${dateStr}&end_date=${dateStr}&hourly=weather_code,temperature_2m&timezone=auto`;
    response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch historical weather data');
    const data = await response.json();
    if (!data.hourly || !data.hourly.weather_code || data.hourly.weather_code.length === 0) {
      throw new Error('No weather data available for this date');
    }
    const sessionHour = sessionDate.getHours();
    const weatherCodeValue = data.hourly.weather_code[sessionHour] || data.hourly.weather_code[0];
    const temperature = data.hourly.temperature_2m[sessionHour] || data.hourly.temperature_2m[0];
    weatherData = { weatherCode: weatherCodeValue, temperature };
  } else if (sessionDate <= sevenDaysFromNow) {
    // Forecast weather
    response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selectedTrack.latitude}&longitude=${selectedTrack.longitude}&hourly=weather_code,temperature_2m&timezone=auto`);
    if (!response.ok) throw new Error('Failed to fetch weather forecast');
    const data = await response.json();
    if (!data.hourly || !data.hourly.time) throw new Error('No weather data available');
    const sessionTime = sessionDate.toISOString();
    let closestIndex = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < data.hourly.time.length; i++) {
      const forecastTime = new Date(data.hourly.time[i]);
      const diff = Math.abs(forecastTime.getTime() - sessionDate.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    weatherData = {
      weatherCode: data.hourly.weather_code[closestIndex],
      temperature: data.hourly.temperature_2m[closestIndex]
    };
  } else {
    throw new Error('Weather forecast is only available up to 7 days in the future');
  }
  return {
    temp: String(Math.round(weatherData.temperature * 10) / 10),
    weatherCode: weatherData.weatherCode
  };
}
