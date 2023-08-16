import React, { createContext, FC, PropsWithChildren, useContext } from "react";
import { PlayerShortVersion } from "../../../types";

const restAPI = process.env.REACT_APP_REST_API_ENDPOINT;

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

interface ContextProps {
  stats: Record<string, TeamPairGuesses | undefined>;
  setStats: React.Dispatch<
    React.SetStateAction<Record<string, TeamPairGuesses | undefined>>
  >;
  putGuess: ({
    date,
    teamPair,
    guessedPlayer,
    isCorrect,
    gameId
  }: {
    date?: string;
    teamPair: string;
    guessedPlayer: PlayerShortVersion;
    isCorrect: boolean;
    gameId?: string;
  }) => Promise<void>;
}

const GuessStatsContext = createContext<ContextProps>({
  stats: {},
  setStats: () => {},
  putGuess: (...args: any[]) => Promise.resolve(),
});

export const GuessStatsContextProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [stats, setStats] = React.useState<
    Record<string, TeamPairGuesses | undefined>
  >({});

  const putGuess = async ({
    date,
    teamPair,
    guessedPlayer,
    isCorrect,
    gameId
  }: {
    date?: string;
    teamPair: string;
    guessedPlayer: PlayerShortVersion;
    isCorrect: boolean;
    gameId?: string;
  }) => {
    if (!date) {
      console.error("No date provided, cannot report!");
      return;
    }

    if (!gameId) {
      console.error("No gameId provided, cannot report!");
      return;
    }

    const key = `${teamPair}-${date}`;

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: guessedPlayer.name,
        person: guessedPlayer.person,
        isCorrect,
        gameId,
      }),
    };

    const urlDate = date.replaceAll(".", "-");
    const resp = await fetch(
      `${restAPI}guesses/by-date-and-team-pair/${urlDate}/${teamPair}`,
      requestOptions
    );

    const json = (await resp.json()) as TeamPairGuesses | undefined;

    setStats((stats) => ({
      ...stats,
      [key]: json,
    }));
  };

  return (
    <GuessStatsContext.Provider value={{ putGuess, stats, setStats }}>
      {children}
    </GuessStatsContext.Provider>
  );
};

export const useGuessStatsContext = () => {
  const context = useContext(GuessStatsContext);

  if (!context) throw new Error("Missing GuessStatsContext");

  return context;
};
