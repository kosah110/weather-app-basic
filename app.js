const apiKey = "8d23c50aa70142398de17b1104bf0254";
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const forecastResult = document.getElementById("forecastResult");
const resultsWrapper = document.getElementById("resultsWrapper");
const originalHeight = resultsWrapper.offsetHeight;

function fadeOut(element) {
  return new Promise(resolve => {
    if (!element) return resolve();
    element.classList.remove('show');
    element.classList.add('hide');
    element.addEventListener('transitionend', () => {
      element.remove();
      resolve();
    }, { once: true });
  });
}

function showLoading(container) {
  const loading = document.createElement('div');
  loading.classList.add('result-content');
  loading.innerHTML = '<div class="loading">Loading...</div>';
  container.appendChild(loading);
  loading.getBoundingClientRect();
  loading.classList.add('show');
  return loading;
}

function createResultContent(data, container = weatherResult) {
  const content = document.createElement('div');
  content.classList.add('result-content');
  content.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p style="text-transform: capitalize;">${data.weather[0].description}</p>
    <p class="temperature">🌡 ${data.main.temp}°C</p>
    <p>Feels like: ${data.main.feels_like}°C</p>
    <p>Humidity: ${data.main.humidity}%</p>
    <p>Wind: ${data.wind.speed} m/s</p>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" />
  `;
  container.appendChild(content);
  content.getBoundingClientRect();
  content.classList.add('show');
}

function displayForecast(dailyForecast, container = forecastResult) {
  dailyForecast.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('forecast-card', 'result-content');
    const date = new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    card.innerHTML = `
      <p>${date}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" />
      <p>${Math.round(item.main.temp)}°C</p>
    `;
    container.appendChild(card);
    card.getBoundingClientRect();
    card.classList.add('show');
  });
}

async function getWeather(city) {
  if (!city) return alert("Please enter a city.");

  // Fade out old results first
  const oldWeather = weatherResult.querySelector('.result-content');
  const oldForecasts = Array.from(forecastResult.querySelectorAll('.forecast-card'));
  await Promise.all([
    oldWeather ? fadeOut(oldWeather) : null,
    ...oldForecasts.map(card => fadeOut(card))
  ]);

  // After fade out, clear containers to avoid duplication
  weatherResult.innerHTML = '';
  forecastResult.innerHTML = '';

  // Shrink container back to original height
  resultsWrapper.style.height = resultsWrapper.offsetHeight + "px";
  requestAnimationFrame(() => {
    resultsWrapper.style.height = originalHeight + "px";
  });

  const loading = showLoading(weatherResult);
  const prevHeight = resultsWrapper.offsetHeight;

  try {
    const [weatherResp, forecastResp] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`)
    ]);

    if (!weatherResp.ok) throw new Error("Weather fetch failed");
    const weatherData = await weatherResp.json();

    let forecastData = [];
    if (forecastResp.ok) {
      const forecastJson = await forecastResp.json();
      forecastData = forecastJson.list.filter(item => item.dt_txt.includes("12:00:00"));
    }

    await fadeOut(loading);

    // Add new content
    createResultContent(weatherData);
    displayForecast(forecastData);

    const newHeight = resultsWrapper.scrollHeight;
    resultsWrapper.style.height = prevHeight + "px";
    requestAnimationFrame(() => {
      resultsWrapper.style.height = newHeight + "px";
    });

    resultsWrapper.addEventListener('transitionend', function handler() {
      resultsWrapper.style.height = 'auto';
      const newContents = resultsWrapper.querySelectorAll('.result-content:not(.show)');
      newContents.forEach(el => el.classList.add('show'));
      resultsWrapper.removeEventListener('transitionend', handler);
    });

  } catch (err) {
    await fadeOut(loading);
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('result-content');
    errorDiv.innerHTML = "Error fetching data.";
    weatherResult.appendChild(errorDiv);

    const newHeight = resultsWrapper.scrollHeight;
    resultsWrapper.style.height = prevHeight + 'px';
    requestAnimationFrame(() => {
      resultsWrapper.style.height = newHeight + 'px';
    });
    resultsWrapper.addEventListener('transitionend', function handler() {
      resultsWrapper.style.height = 'auto';
      errorDiv.classList.add('show');
      resultsWrapper.removeEventListener('transitionend', handler);
    });
  }
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  getWeather(city);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});
