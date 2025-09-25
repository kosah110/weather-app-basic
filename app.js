const apiKey = "8d23c50aa70142398de17b1104bf0254"; // Your OpenWeatherMap API key
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");

// Fetch weather data from API
async function getWeather(city) {
  if (!city) {
    weatherResult.innerHTML = "Please enter a city.";
    return;
  }

  weatherResult.innerHTML = "Loading...";

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      if (response.status === 404) {
        weatherResult.innerHTML = "City not found.";
      } else {
        weatherResult.innerHTML = "Error fetching data.";
      }
      return;
    }

    const data = await response.json();
    displayWeather(data);
  } catch (error) {
    console.error(error);
    weatherResult.innerHTML = "Network error. Please try again.";
  }
}

// Display weather info in the UI
function displayWeather(data) {
  weatherResult.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p style="text-transform: capitalize;">${data.weather[0].description}</p>
    <p>🌡 Temperature: ${data.main.temp}°C</p>
    <p>Feels like: ${data.main.feels_like}°C</p>
    <p>Humidity: ${data.main.humidity}%</p>
    <p>Wind: ${data.wind.speed} m/s</p>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" />
  `;
}

// Event listener for search button
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  getWeather(city);
});

// Allow pressing Enter key to search
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});
