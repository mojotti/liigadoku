import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./App";
import reportWebVitals from "./reportWebVitals";
import { GuessStatsContextProvider } from "./context/GuessStats";
import { GameInitContextProvider } from "./context/GameInit";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <GameInitContextProvider>
      <GuessStatsContextProvider>
        <App />
      </GuessStatsContextProvider>
    </GameInitContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
