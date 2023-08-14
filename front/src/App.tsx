import React, { useCallback } from "react";
import "./App.css";
import { GameGrid } from "./GameGrid";
import { useAsync } from "react-use";
import {
  LiigadokuOfTheDay,
  PlayerShortVersion,
  TeamPairPlayers,
} from "../../types";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import ShareIcon from "@mui/icons-material/Share";
import { PlayerList } from "./PlayerList";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import HelpIcon from "@mui/icons-material/HelpOutline";
import TwitterIcon from "@mui/icons-material/Twitter";

const helpTexts = [
  "Tervetuloa pelaamaan Liigadokua!",
  "Pelissä on tarkoituksena löytää ruutuun pelaaja, joka on pelannut molemmissa ruudun joukkueissa.",
  "Joka päivä on tarjolla uusi peli ja uudet joukkueet.",
  "Pelin jälkeen voit jakaa tuloksesi ja haastaa kaverisi peliin.",
  "Huom! Liigadokussa huomioidaan vain joukkueen Liiga-kaudet. Esim. Jukureiden Mestis-ajan pelaajat eivät kelpaa vastaukseksi.",
];

const restAPI = process.env.REACT_APP_REST_API_ENDPOINT;

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

type Score = {
  correctAnswers: number;
  guesses: number;
};

const getIcon = (status: boolean) => (status ? "🟩" : "🟥");

const formatScoreText = (
  gameState: GameState,
  score: Score,
  doku?: LiigadokuOfTheDay
) => {
  return `Liigadoku ${doku?.date}.
  
🏒🏒 Sain oikein ${score.correctAnswers}/${score.guesses}! 🎉🎉

${getIcon(gameState["0-0"].status)}${getIcon(gameState["1-0"].status)}${getIcon(
    gameState["2-0"].status
  )}  
${getIcon(gameState["0-1"].status)}${getIcon(gameState["1-1"].status)}${getIcon(
    gameState["2-1"].status
  )}  
${getIcon(gameState["0-2"].status)}${getIcon(gameState["1-2"].status)}${getIcon(
    gameState["2-2"].status
  )}

Käy kokeilemassa omia taitojasi: https://www.liigadoku.com`;
};

const formMatchUps = (doku: LiigadokuOfTheDay) =>
  doku.xTeams
    .map((xTeam, i) =>
      doku.yTeams.map((yTeam, j) => ({
        key: `xTeam${i}yTeam${j}`,
        teams: [xTeam, yTeam].sort(),
      }))
    )
    .flat();

const putGuess = async ({
  date,
  teamPair,
  guessedPlayer,
  isCorrect,
}: {
  date?: string;
  teamPair: string;
  guessedPlayer: PlayerShortVersion;
  isCorrect: boolean;
}) => {
  if (!date) {
    console.error("No date provided, cannot report!");
    return;
  }
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: guessedPlayer.name,
      person: guessedPlayer.person,
      isCorrect,
    }),
  };

  const urlDate = date.replaceAll(".", "-");
  fetch(
    `${restAPI}guesses/by-date-and-team-pair/${urlDate}/${teamPair}`,
    requestOptions
  );
};

export const App = () => {
  const [loadingPlayers, setLoadingPlayers] = React.useState<boolean>(true);
  const [loadingTeams, setLoadingTeams] = React.useState<boolean>(true);
  const [dokuOfTheDay, setDokuOfTheDay] = React.useState<LiigadokuOfTheDay>();
  const [players, setPlayers] = React.useState<PlayerShortVersion[]>([]);
  const [filteredPlayers, setFilteredPlayers] = React.useState<
    PlayerShortVersion[]
  >([]);
  const [answers, setAnswers] = React.useState<
    Record<string, { person: string }[]>
  >({});
  const [currentGuess, setCurrentGuess] = React.useState<CurrentGuess>();

  const [score, setScore] = React.useState<Score>({
    correctAnswers: 0,
    guesses: 0,
  });

  const [gameState, setGameState] = React.useState<GameState>({});
  const [open, setOpen] = React.useState(false);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [isHelpOpen, setHelpOpen] = React.useState(false);

  useAsync(async () => {
    const response = await fetch(`${restAPI}players/all`);
    const result = await response.json();

    setPlayers(result.players);
    setLoadingPlayers(false);
  }, [setPlayers, restAPI]);

  useAsync(async () => {
    const dokuResponse = await fetch(`${restAPI}liigadoku-of-the-day`);
    const dokuJson = await dokuResponse.json();

    setDokuOfTheDay(dokuJson);

    const matchUps = formMatchUps(dokuJson);

    const promises = matchUps.map((matchUp) =>
      fetch(`${restAPI}players/team-pairs/${matchUp.teams.join("-")}`)
    );

    const respsRaw = await Promise.all(promises);
    const resps = (await Promise.all(
      respsRaw.map((resp) => resp.json())
    )) as TeamPairPlayers[];

    const answers: Record<string, { person: string }[]> = {};
    resps.forEach((resp) => {
      answers[resp.teamPair] = resp.players;
    });
    setAnswers(answers);
    setLoadingTeams(false);
  }, [restAPI]);

  const onGuessStart = useCallback(
    (xTeam: string, yTeam: string, x: number, y: number) => {
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
    <Stack className="container" alignItems="center" rowGap="1rem">
      <Stack
        direction="row"
        justifyContent="space-between"
        width="100%"
        alignItems="flex-start"
        p="1rem 0"
      >
        <Stack direction="column" alignItems="flex-start">
          <h1 className="header">Liigadoku 🏒🔢</h1>
          <Typography variant="body1" mb="0.5rem">
            {dokuOfTheDay?.date}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center">
          <Link href="https://twitter.com/liigadoku" target="_blank">
            <TwitterIcon sx={{ color: "#fffffff3" }} fontSize="large" />
          </Link>

          <IconButton
            onClick={() => setHelpOpen(true)}
            sx={{
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <HelpIcon sx={{ color: "#fffffff3" }} fontSize="large" />
          </IconButton>
        </Stack>
      </Stack>

      <Modal open={isHelpOpen} onClose={() => setHelpOpen(false)}>
        <Paper
          sx={{
            position: "absolute",
            top: "4rem",
            right: "2rem",
            height: "auto",
            maxWidth: "300px",
          }}
        >
          <Stack padding={"1rem"} rowGap={"1rem"}>
            {helpTexts.map((text) => (
              <Typography key={text} variant="body2">
                {text}
              </Typography>
            ))}
          </Stack>
        </Paper>
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-player-list"
        aria-describedby="modal-all-players"
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
          }}
          onFilter={onFilter}
        />
      </Modal>
      {!isLoading && (
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
      {isLoading && <h2>Ladataan...</h2>}
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
