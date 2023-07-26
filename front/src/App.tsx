import React, { useCallback } from "react";
import "./App.css";
import { GameGrid } from "./GameGrid";
import { useAsync } from "react-use";
import { PlayerShortVersion, TeamPairPlayers } from "../../types";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";

import { PlayerList } from "./PlayerList";
import { Typography } from "@mui/material";

const xTeams = ["JYP", "Ässät", "Tappara"];
const yTeams = ["TPS", "Kärpät", "HIFK"];

const matchUps = xTeams
  .map((xTeam, i) =>
    yTeams.map((yTeam, j) => ({
      key: `xTeam${i}yTeam${j}`,
      teams: [xTeam, yTeam].sort(),
    }))
  )
  .flat();

const restAPI = process.env.REACT_APP_REST_API_ENDPOINT;

export type GameState = Record<string, { status: boolean; name: string }>;

export const App = () => {
  const [players, setPlayers] = React.useState<PlayerShortVersion[]>([]);
  const [filteredPlayers, setFilteredPlayers] = React.useState<
    PlayerShortVersion[]
  >([]);
  const [answers, setAnswers] = React.useState<
    Record<string, PlayerShortVersion[]>
  >({});
  const [currentGuess, setCurrentGuess] = React.useState<{
    gridItem: [number, number];
    correctAnswers: PlayerShortVersion[];
  }>();

  const [score, setScore] = React.useState<{
    correctAnswers: number;
    guesses: number;
  }>({ correctAnswers: 0, guesses: 0 });

  const [gameState, setGameState] = React.useState<GameState>({});
  const [open, setOpen] = React.useState(false);

  useAsync(async () => {
    const response = await fetch(`${restAPI}players/all`);
    const result = await response.json();

    setPlayers(result.players);
  }, [setPlayers, restAPI]);

  useAsync(async () => {
    const promises = matchUps.map((matchUp) =>
      fetch(`${restAPI}/players/team-pairs/${matchUp.teams.join("-")}`)
    );

    const respsRaw = await Promise.all(promises);
    const resps = (await Promise.all(
      respsRaw.map((resp) => resp.json())
    )) as TeamPairPlayers[];

    const answers: Record<string, PlayerShortVersion[]> = {};
    resps.forEach((resp) => {
      answers[resp.teamPair] = resp.players;
    });
    setAnswers(answers);
  }, [restAPI]);

  const onGuessStart = useCallback(
    (xTeam: string, yTeam: string, x: number, y: number) => {
      const correctAnswers = answers[[xTeam, yTeam].sort().join("-")];
      setCurrentGuess({ gridItem: [x, y], correctAnswers });
      setOpen(true);
    },
    [answers, setCurrentGuess, setOpen]
  );

  const onFilter = useCallback(
    (query: string) =>
      setFilteredPlayers(
        players.filter((player) =>
          player.name.toLowerCase().includes(query.toLowerCase())
        )
      ),
    [players, setFilteredPlayers]
  );

  return (
    <Stack className="container" alignItems="center" rowGap={"4rem"}>
      <h1 className="header">Tervetuloa pelaamaan Liigadokua!</h1>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <PlayerList
          allPlayers={players}
          filteredPlayers={filteredPlayers}
          onPlayerClick={(player) => {
            if (!currentGuess) {
              throw new Error("Invalid game state!");
            }

            const correctPersons = currentGuess.correctAnswers.map(
              (p) => p.person
            );

            if (correctPersons.includes(player.person)) {
              setGameState({
                ...gameState,
                [currentGuess.gridItem.join("-")]: {
                  status: true,
                  name: player.name,
                },
              });
              setScore({
                correctAnswers: score.correctAnswers + 1,
                guesses: score.guesses + 1,
              });
            } else {
              setGameState({
                ...gameState,
                [currentGuess.gridItem.join("-")]: {
                  status: false,
                  name: player.name,
                },
              });
              setScore({
                correctAnswers: score.correctAnswers,
                guesses: score.guesses + 1,
              });
            }
            setOpen(false);
          }}
          onFilter={onFilter}
          resetFilter={() => setFilteredPlayers([])}
        />
      </Modal>
      <GameGrid
        xTeams={xTeams}
        yTeams={yTeams}
        onGuess={onGuessStart}
        gameState={gameState}
      />
      <h2>{`Pisteet: ${score.correctAnswers}/${score.guesses}`}</h2>
    </Stack>
  );
};
