import React, { useCallback } from "react";
import "./App.css";
import { GameGrid } from "./components/GameGrid";
import { PlayerShortVersion } from "../../types";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import ShareIcon from "@mui/icons-material/Share";
import { PlayerList } from "./components/PlayerList";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useGuessStatsContext } from "./context/GuessStats";
import { useGameInitContext } from "./context/GameInit";
import { formatScoreText } from "./utils/score-text";
import { Header } from "./components/Header";

export type Guess = {
  status: boolean;
  name: string;
  person: string;
};

export type GameState = Record<string, Guess>;

export type CurrentGuess = {
  gridItem: [number, number];
  teams: [string, string];
  correctAnswers: { person: string }[];
};

export type Score = {
  correctAnswers: number;
  guesses: number;
};

export const App = () => {
  const { players, answers, dokuOfTheDay, isLoadingInitData } =
    useGameInitContext();
  const [filteredPlayers, setFilteredPlayers] = React.useState<
    PlayerShortVersion[]
  >([]);

  const [currentGuess, setCurrentGuess] = React.useState<CurrentGuess>();

  const [score, setScore] = React.useState<Score>({
    correctAnswers: 0,
    guesses: 0,
  });

  const [gameState, setGameState] = React.useState<GameState>({});
  const [open, setOpen] = React.useState(false);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  const onGuessStart = useCallback(
    (xTeam: string, yTeam: string, x: number, y: number) => {
      if (!answers) {
        console.error("No answers provided, cannot start guessing!");
        return;
      }

      const correctAnswers = answers[[xTeam, yTeam].sort().join("-")];
      setCurrentGuess({
        gridItem: [x, y],
        teams: [xTeam, yTeam],
        correctAnswers,
      });
      setOpen(true);
    },
    [answers, setCurrentGuess, setOpen]
  );

  const onFilter = useCallback(
    (query: string) =>
      setFilteredPlayers(
        (players ?? []).filter((player) =>
          player.name.toLowerCase().includes(query.toLowerCase())
        )
      ),
    [players, setFilteredPlayers]
  );

  React.useEffect(() => {
    if (!open) {
      setFilteredPlayers([]);
    }
  }, [open, setFilteredPlayers]);

  const { putGuess } = useGuessStatsContext();

  const onPlayerClick = useCallback(
    (player: PlayerShortVersion) => {
      if (!currentGuess?.correctAnswers) {
        throw new Error("Invalid game state!");
      }

      const correctPersons = currentGuess.correctAnswers.map((p) => p.person);
      const isCorrect = correctPersons.includes(player.person);

      setGameState({
        ...gameState,
        [currentGuess.gridItem.join("-")]: {
          status: isCorrect,
          name: player.name,
          person: player.person,
        },
      });
      setScore({
        correctAnswers: score.correctAnswers + +isCorrect,
        guesses: score.guesses + 1,
      });
      setOpen(false);
      // do not wait on purpose
      putGuess({
        date: dokuOfTheDay?.date,
        guessedPlayer: player,
        teamPair: currentGuess.teams.sort().join("-"),
        isCorrect,
      });
    },
    [currentGuess, dokuOfTheDay, gameState, putGuess, score]
  );

  return (
    <Stack className="container" alignItems="center" rowGap="1rem">
      <Header dokuOfTheDay={dokuOfTheDay} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-player-list"
        aria-describedby="modal-all-players"
      >
        <PlayerList
          allPlayers={players ?? []}
          currentGuess={currentGuess}
          filteredPlayers={filteredPlayers}
          onPlayerClick={onPlayerClick}
          onFilter={onFilter}
        />
      </Modal>
      {!isLoadingInitData && (
        <>
          <GameGrid
            xTeams={dokuOfTheDay?.xTeams ?? []}
            yTeams={dokuOfTheDay?.yTeams ?? []}
            onGuess={onGuessStart}
            gameState={gameState}
            date={dokuOfTheDay?.date}
            gameOver={score.guesses === 9}
          />
          <h2>{`Pisteet: ${score.correctAnswers}/9`}</h2>
        </>
      )}
      {isLoadingInitData && <h2>Ladataan...</h2>}
      {score.guesses === 9 && (
        <Stack gap={"1rem"}>
          <Tooltip
            title={
              <Typography variant="body2">
                {"Kopioitu leikepöydälle"}
              </Typography>
            }
            placement="top"
            open={tooltipOpen}
          >
            <Button
              variant="contained"
              startIcon={<ShareIcon fontSize="small" />}
              onClick={() => {
                setTooltipOpen(true);
                navigator.clipboard.writeText(
                  formatScoreText(gameState, score, dokuOfTheDay)
                );
                setTimeout(() => setTooltipOpen(false), 2000);
              }}
            >
              <>{"Kopioi tulos"}</>
            </Button>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  );
};
