import React from "react";
import "./App.css";
import { GameState } from "./App";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

const getPictureUrl = (team: string) => {
  const teamNormalized = team.toLowerCase().replace(new RegExp(/ä/g), "a");

  return `./logos/${teamNormalized}.png`;
};

const borderRadius = (item: string) => {
  switch (item) {
    case "xTeam0yTeam0":
      return "12px 0 0 0";
    case "xTeam2yTeam0":
      return "0 12px 0 0";
    case "xTeam0yTeam2":
      return "0 0 0 12px";
    case "xTeam2yTeam2":
      return "0 0 12px 0";
    default:
      return "0";
  }
};

const teamsWithBadge = ["Jokerit", "Jukurit", "Sport", "KooKoo"];

const showBadge = (team: string) => {
  return teamsWithBadge.includes(team);
};

const getImg = (team: string) => {
  const img = (
    <img
      src={getPictureUrl(team)}
      width="70px"
      height="70px"
      alt={getPictureUrl(team)}
    />
  );

  if (showBadge(team)) {
    return (
      <Tooltip
        placement="top-start"
        title={
          <Typography variant="body2">
            Vain joukkueen Liiga-kausien pelaajat
          </Typography>
        }
      >
        <Badge
          badgeContent={<Typography fontSize={"12px"}>*Liiga</Typography>}
          color="secondary"
        >
          {img}
        </Badge>
      </Tooltip>
    );
  }

  return img;
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
          {getImg(xTeam)}
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
          {getImg(yTeam)}
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
                background:
                  guess?.status != null
                    ? guess.status
                      ? "#01796F"
                      : "#BD3039"
                    : "none",
                borderRadius: borderRadius(`xTeam${i}yTeam${j}`),
                overflow: "hidden",
                margin: "2px",
              }}
              className={"innerGridItem"}
            >
              {guess && (
                <Typography variant="body2" p="1px" overflow="hidden">
                  {guess.name}
                </Typography>
              )}
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
