import React, { useCallback } from "react";
import "./App.css";
import { GameGrid } from "./GameGrid";
import { useAsync } from "react-use";
import { PlayerShortVersion, TeamPairPlayers } from "../../types";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import ShareIcon from "@mui/icons-material/Share";
import { PlayerList } from "./PlayerList";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

const xTeams = ["SaiPa", "Lukko", "Jokerit"];
const yTeams = ["Ilves", "HPK", "Blues"];

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

export type CurrentGuess = {
  gridItem: [number, number];
  teams: [string, string];
  correctAnswers: PlayerShortVersion[];
};
type Score = {
  correctAnswers: number;
  guesses: number;
};

const getIcon = (status: boolean) => (status ? "🟩" : "🟥");

const formatScoreText = (gameState: GameState, score: Score) => {
  return `🏒🏒 Sain oikein ${score.correctAnswers}/${score.guesses}! 🎉🎉

${getIcon(gameState["0-0"].status)}${getIcon(gameState["1-0"].status)}${getIcon(
    gameState["2-0"].status
  )}  
${getIcon(gameState["0-1"].status)}${getIcon(gameState["1-1"].status)}${getIcon(
    gameState["2-1"].status
  )}  
${getIcon(gameState["0-2"].status)}${getIcon(gameState["1-2"].status)}${getIcon(
    gameState["2-2"].status
  )}  

Käy kokeilemassa omia taitojasi: https://liigadoku.com
  `;
};

export const App = () => {
  const [loadingPlayers, setLoadingPlayers] = React.useState<boolean>(true);
  const [loadingTeams, setLoadingTeams] = React.useState<boolean>(true);
  const [players, setPlayers] = React.useState<PlayerShortVersion[]>([]);
  const [filteredPlayers, setFilteredPlayers] = React.useState<
    PlayerShortVersion[]
  >([]);
  const [answers, setAnswers] = React.useState<
    Record<string, PlayerShortVersion[]>
  >({});
  const [currentGuess, setCurrentGuess] = React.useState<CurrentGuess>();

  const [score, setScore] = React.useState<Score>({
    correctAnswers: 0,
    guesses: 0,
  });

  const [gameState, setGameState] = React.useState<GameState>({});
  const [open, setOpen] = React.useState(false);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  console.log({ gameState });
  useAsync(async () => {
    const response = await fetch(`${restAPI}players/all`);
    const result = await response.json();

    setPlayers(result.players);
    setLoadingPlayers(false);
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
    setLoadingTeams(false);
  }, [restAPI]);

  const onGuessStart = useCallback(
    (xTeam: string, yTeam: string, x: number, y: number) => {
      console.log({ xTeam, yTeam, x, y });
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
        players.filter((player) =>
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

  const isLoading = loadingPlayers || loadingTeams;

  return (
    <Stack className="container" alignItems="center" rowGap={"1.5rem"}>
      <h1 className="header">Liigadoku 🏒🔢</h1>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <PlayerList
          allPlayers={players}
          currentGuess={currentGuess}
          filteredPlayers={filteredPlayers}
          onPlayerClick={(player) => {
            if (!currentGuess?.correctAnswers) {
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
        />
      </Modal>
      {!isLoading && (
        <>
          <GameGrid
            xTeams={xTeams}
            yTeams={yTeams}
            onGuess={onGuessStart}
            gameState={gameState}
          />
          <h2>{`Pisteet: ${score.correctAnswers}/9`}</h2>
        </>
      )}
      {isLoading && <h2>Ladataan...</h2>}
      {score.guesses === 9 && (
        <Stack gap={"1rem"}>
          <Tooltip
            title={
              <Typography variant="body2">
                {"Kopioitu leikepöydälle!"}
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
                  formatScoreText(gameState, score)
                );
                setTimeout(() => setTooltipOpen(false), 2000);
              }}
            >
              <>{"Jaa tulos"}</>
            </Button>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  );
};
