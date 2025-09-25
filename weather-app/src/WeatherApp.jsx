import React, { useState, useRef, useEffect } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./App.css";

const apiKey = "8d23c50aa70142398de17b1104bf0254";
const ANIM_MS = 400;

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  const wrapperRef = useRef(null);
  const originalHeightRef = useRef(0);
  const weatherRef = useRef(null);
  const loadingRef = useRef(null);
  const errorRef = useRef(null);
  const exitWaitRef = useRef(null);
  const loadingExitResolverRef = useRef(null);
  const forecastNodeRefs = useRef({});

  useEffect(() => {
    const el = wrapperRef.current;
    if (el) {
      originalHeightRef.current = el.scrollHeight || 0;
      el.style.height = "auto";
    }
  }, []);

  const waitForTransitionEnd = (el, timeout = ANIM_MS + 200) => {
    if (!el) return Promise.resolve();
    return new Promise((resolve) => {
      let resolved = false;
      const handler = (ev) => {
        if (ev.target !== el) return;
        if (ev.propertyName && ev.propertyName !== "height") return;
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      el.addEventListener("transitionend", handler, { once: true });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, timeout);
    });
  };

  const waitForExits = (expectedCount) => {
    if (!expectedCount) return Promise.resolve();
    return new Promise((resolve) => {
      exitWaitRef.current = { expected: expectedCount, count: 0, resolve };
    });
  };

  const childExited = () => {
    const s = exitWaitRef.current;
    if (!s) return;
    s.count += 1;
    if (s.count >= s.expected) {
      s.resolve();
      exitWaitRef.current = null;
    }
  };

  const handleLoadingExited = () => {
    if (loadingExitResolverRef.current) {
      loadingExitResolverRef.current();
      loadingExitResolverRef.current = null;
    }
  };

  const doSearch = async (query) => {
    if (!query) {
      setError("Please enter a city.");
      return;
    }
    setError("");

    const el = wrapperRef.current;
    const hadResults = !!weather || forecast.length > 0;

    try {
      if (hadResults) {
        if (el) {
          el.style.height = el.offsetHeight + "px";
          el.getBoundingClientRect();
        }

        const expectedExits = (weather ? 1 : 0) + forecast.length;
        const exitPromise = waitForExits(expectedExits);
        setShowResults(false);

        if (el) {
          requestAnimationFrame(() => {
            el.style.height = (originalHeightRef.current || 0) + "px";
          });
        }

        await Promise.all([exitPromise, waitForTransitionEnd(el)]);
      }

      setLoading(true);
      const loaderDelay = new Promise((resolve) => setTimeout(resolve, 800));

      const [weatherResp, forecastResp] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            query
          )}&appid=${apiKey}&units=metric`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
            query
          )}&appid=${apiKey}&units=metric`
        ),
        loaderDelay,
      ]);

      if (!weatherResp.ok) throw new Error("Weather fetch failed");
      const weatherJson = await weatherResp.json();

      let forecastList = [];
      if (forecastResp.ok) {
        const forecastJson = await forecastResp.json();
        forecastList = forecastJson.list.filter((item) =>
          item.dt_txt.includes("12:00:00")
        );
      }

      if (el) {
        el.style.height = el.offsetHeight + "px";
        el.getBoundingClientRect();
      }

      const loadingExitedPromise = new Promise((resolve) => {
        loadingExitResolverRef.current = resolve;
      });

      setLoading(false);
      await loadingExitedPromise;

      if (el) {
        el.style.height = el.offsetHeight + "px";
        el.getBoundingClientRect();
      }

      forecastNodeRefs.current = {};
      setWeather(weatherJson);
      setForecast(forecastList);
      setShowResults(true);

      if (el) {
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          el.style.height = newHeight + "px";
        });
        await waitForTransitionEnd(el);
        el.style.height = "auto";
      }
    } catch (err) {
      try {
        if (el) {
          el.style.height = el.offsetHeight + "px";
          el.getBoundingClientRect();
        }
        const loadingExitedPromise = new Promise((resolve) => {
          loadingExitResolverRef.current = resolve;
        });
        setLoading(false);
        await loadingExitedPromise;
      } catch (e) {}

      setError("Error fetching data.");
      if (el) {
        el.style.height = el.offsetHeight + "px";
        el.getBoundingClientRect();
        await new Promise((resolve) => setTimeout(resolve, 20));
        requestAnimationFrame(() => {
          el.style.height = el.scrollHeight + "px";
        });
        await waitForTransitionEnd(el);
        el.style.height = "auto";
      }
    }
  };

  const handleSearchClick = () => doSearch(city.trim());
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearchClick();
  };

  const getForecastRef = (dt) => {
    if (!forecastNodeRefs.current[dt])
      forecastNodeRefs.current[dt] = React.createRef();
    return forecastNodeRefs.current[dt];
  };

  return (
    <div className="container">
      <h1>Weather App</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="City name"
        />
        <button onClick={handleSearchClick} aria-label="Search weather">
          Search
        </button>
      </div>
      <div className="results-wrapper" ref={wrapperRef}>
        <TransitionGroup>
          {loading && (
            <CSSTransition
              key="loading"
              timeout={ANIM_MS}
              classNames="fade"
              nodeRef={loadingRef}
              onExited={handleLoadingExited}
            >
              <div ref={loadingRef} className="result-content">
                <div className="loading">Loading...</div>
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
        <TransitionGroup>
          {error && (
            <CSSTransition
              key="error"
              timeout={ANIM_MS}
              classNames="fade"
              nodeRef={errorRef}
              onExited={() => setError("")}
            >
              <div ref={errorRef} className="result-content">
                {error}
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
        <TransitionGroup>
          {showResults && weather && (
            <CSSTransition
              key={`weather-${weather.id || weather.name}`}
              timeout={ANIM_MS}
              classNames="fade"
              nodeRef={weatherRef}
              onExited={childExited}
            >
              <div ref={weatherRef}>
                <WeatherCard data={weather} />
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
        <div className="forecast-container">
          <TransitionGroup component={null}>
            {showResults &&
              forecast.map((item) => {
                const key = item.dt.toString();
                const ref = getForecastRef(key);
                return (
                  <CSSTransition
                    key={key}
                    timeout={ANIM_MS}
                    classNames="fade"
                    nodeRef={ref}
                    onExited={childExited}
                  >
                    <div ref={ref}>
                      <ForecastCard item={item} />
                    </div>
                  </CSSTransition>
                );
              })}
          </TransitionGroup>
        </div>
      </div>
    </div>
  );
}

function WeatherCard({ data }) {
  return (
    <div className="result-content">
      <h2>
        {data.name}, {data.sys?.country}
      </h2>
      <p style={{ textTransform: "capitalize" }}>
        {data.weather?.[0]?.description}
      </p>
      <p className="temperature">🌡 {Math.round(data.main?.temp)}°C</p>
      <p>Feels like: {Math.round(data.main?.feels_like)}°C</p>
      <p>Humidity: {data.main?.humidity}%</p>
      <p>Wind: {data.wind?.speed} m/s</p>
      <img
        src={`https://openweathermap.org/img/wn/${data.weather?.[0]?.icon}@2x.png`}
        alt={data.weather?.[0]?.description || "weather"}
      />
    </div>
  );
}

function ForecastCard({ item }) {
  const date = new Date(item.dt_txt).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
  return (
    <div className="forecast-card">
      <p>{date}</p>
      <img
        src={`https://openweathermap.org/img/wn/${item.weather?.[0]?.icon}.png`}
        alt={item.weather?.[0]?.description}
      />
      <p>{Math.round(item.main?.temp)}°C</p>
    </div>
  );
}
