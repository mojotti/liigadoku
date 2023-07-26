import React from "react";
import "./App.css";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { GameState } from "./App";
import { Typography } from "@mui/material";

const getPictureUrl = (team: string) => {
  const teamNormalized = team.toLowerCase().replace(new RegExp(/ä/g), "a");

  return `./logos/${teamNormalized}.png`;
};

export const GameGrid = ({
  onGuess,
  xTeams,
  yTeams,
  gameState,
}: {
  onGuess: (xTeam: string, yTeam: string, x: number, y: number) => void;
  xTeams: string[];
  yTeams: string[];
  gameState: GameState;
}) => {
  return (
    <div className="gameGrid">
      {xTeams.map((xTeam, i) => (
        <Grid
          key={xTeam}
          sx={{
            gridArea: `xTeam${i}`,
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <img
            src={getPictureUrl(xTeam)}
            width="70px"
            height="70px"
            alt={getPictureUrl(xTeam)}
          />
        </Grid>
      ))}

      {yTeams.map((yTeam, i) => (
        <Grid
          key={yTeam}
          sx={{
            gridArea: `yTeam${i}`,
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <img
            src={getPictureUrl(yTeam)}
            width="70px"
            height="70px"
            alt={getPictureUrl(yTeam)}
          />
        </Grid>
      ))}
      {xTeams.map((xTeam, i) =>
        yTeams.map((yTeam, j) => {
          const guess = gameState[`${i}-${j}`];

          return (
            <Grid
              key={`xTeam${i}yTeam${j}`}
              item
              sx={{
                gridArea: `xTeam${i}yTeam${j}`,
                border: "1px solid #000",
                background:
                  guess?.status != null
                    ? guess.status
                      ? "#1c7957"
                      : "#9e1e1e"
                    : "none",
              }}
              className="innerGridItem"
            >
              {guess && <Typography variant="body2">{guess.name}</Typography>}
              {!guess && (
                <Button
                  onClick={() => onGuess(xTeam, yTeam, i, j)}
                  sx={{
                    background: "#7793d8",
                    width: "100%",
                    height: "100%",
                    borderRadius: 0,
                    "&:hover": {
                      background: "#76e7f4",
                    },
                  }}
                />
              )}
            </Grid>
          );
        })
      )}
    </div>
  );
};
