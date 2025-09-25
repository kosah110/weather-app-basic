import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

const WeatherCard = ({ data }) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition
      in={!!data}
      appear
      timeout={500}
      classNames="fade"
      nodeRef={nodeRef}
      unmountOnExit
    >
      <div ref={nodeRef} className="result-content">
        <h2>
          {data.name}, {data.sys.country}
        </h2>
        <p style={{ textTransform: "capitalize" }}>
          {data.weather[0].description}
        </p>
        <p className="temperature">🌡 {data.main.temp}°C</p>
        <p>Feels like: {data.main.feels_like}°C</p>
        <p>Humidity: {data.main.humidity}%</p>
        <p>Wind: {data.wind.speed} m/s</p>
        <img
          src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
          alt={data.weather[0].description}
        />
      </div>
    </CSSTransition>
  );
};

export default WeatherCard;
