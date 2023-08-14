import React, { useCallback } from "react";
import "./App.css";
import { GameState, Guess } from "./App";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Results } from "./Results";
import { IconButton, useMediaQuery } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";

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

const getImg = (team: string) => {
  const img = (
    <img
      src={getPictureUrl(team)}
      width="70px"
      height="70px"
      alt={getPictureUrl(team)}
    />
  );

  return img;
};

export type Stats = {
  isCorrect: boolean;
  person: string;
  name: string;
  numOfGuesses: number;
};

export type TeamPairGuesses = {
  guessedPlayers: Record<string, Stats>;
  date: string;
  totalGuesses: number;
  teamPair: string;
};

const restAPI = process.env.REACT_APP_REST_API_ENDPOINT;

export const GameGrid = ({
  onGuess,
  xTeams,
  yTeams,
  gameState,
  date,
  gameOver,
}: {
  onGuess: (xTeam: string, yTeam: string, x: number, y: number) => void;
  xTeams: string[];
  yTeams: string[];
  gameState: GameState;
  date?: string;
  gameOver: boolean;
}) => {
  const [stats, setStats] = React.useState<
    Record<string, TeamPairGuesses | undefined>
  >({});
  const [currentlyOpenStats, setCurrentlyOpenStats] = React.useState<{
    teamPair: string;
    sortedTeamPair: string;
  }>({ teamPair: "", sortedTeamPair: "" });
  const [open, setOpen] = React.useState<boolean>(false);

  const fetchStats = async (teamPair: string) => {
    if (!date) {
      console.error("date is missing");
      return;
    }

    const key = `${teamPair}-${date}`;

    if (stats[key]) {
      return;
    }
    const urlDate = date.replaceAll(".", "-");

    const resp = await fetch(
      `${restAPI}guesses/by-date-and-team-pair/${urlDate}/${teamPair}`
    );
    const json = (await resp.json()) as TeamPairGuesses | undefined;

    setStats((stats) => ({
      ...stats,
      [key]: json,
    }));
  };

  const currentResultList =
    stats[`${currentlyOpenStats.sortedTeamPair}-${date}`];

  const getPercentage = useCallback(
    (xTeam: string, yTeam: string, guess: Guess) => {
      const sortedTeamPair = [xTeam, yTeam].sort().join("-");
      const key = `${sortedTeamPair}-${date}`;

      const numOfGuesses =
        (stats[key]?.guessedPlayers?.[guess.person]?.numOfGuesses || 0) + 1;

      const total = stats[key]?.totalGuesses ?? 1;

      const percentage = (numOfGuesses / total) * 100;

      if (isNaN(percentage)) {
        return "0";
      }

      return percentage.toFixed(percentage < 1 ? 1 : 0);
    },
    [date, stats]
  );

  const isOverMediumSize = useMediaQuery("(min-width: 460px)");

  return (
    <>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <Results
          guesses={currentResultList}
          teamPair={currentlyOpenStats.teamPair}
          onClose={() => setOpen(false)}
        />
      </Modal>
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
                  flexDirection: "column",
                }}
                className={"innerGridItem"}
              >
                <Stack
                  flexDirection="column"
                  justifyContent="space-between"
                  flexGrow={1}
                >
                  <Stack flexDirection="row" justifyContent="space-between">
                    {guess && (
                      <Typography
                        variant="body2"
                        sx={{
                          background: "#111010",
                          borderBottomRightRadius: "5px",
                          padding: "3px",
                          height: "min-content",
                          fontSize: isOverMediumSize ? "14px" : "12px",
                        }}
                      >
                        {getPercentage(xTeam, yTeam, guess)}%
                      </Typography>
                    )}
                    {guess && gameOver && (
                      <IconButton
                        onClick={() => {
                          const sortedTeamPair = [xTeam, yTeam]
                            .sort()
                            .join("-");
                          const teamPair = [xTeam, yTeam].join(" - ");
                          fetchStats(sortedTeamPair);
                          setCurrentlyOpenStats({ sortedTeamPair, teamPair });
                          setOpen(true);
                        }}
                        sx={{
                          color: "#FFF",
                          padding: "2px",
                          background: "rgba(0, 0, 0, 0.5)",
                          margin: "1px 1px 0 0",
                        }}
                      >
                        <BarChartIcon
                          fontSize={isOverMediumSize ? "large" : "medium"}
                        />
                      </IconButton>
                    )}
                  </Stack>
                  {guess && (
                    <Typography
                      variant="body2"
                      p="1px"
                      overflow="hidden"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      flexGrow={1}
                      fontSize={isOverMediumSize ? "14px" : "12px"}
                    >
                      {guess.name}
                    </Typography>
                  )}
                </Stack>
                {!guess && (
                  <Button
                    onClick={() => {
                      const sortedTeamPair = [xTeam, yTeam].sort().join("-");
                      fetchStats(sortedTeamPair);
                      onGuess(xTeam, yTeam, i, j);
                    }}
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
    </>
  );
};
