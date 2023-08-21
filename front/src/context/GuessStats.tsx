import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
} from "react";
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
  putGuess: ({
    date,
    teamPair,
    guessedPlayer,
    isCorrect,
    gameId,
  }: {
    date?: string;
    teamPair: string;
    guessedPlayer: PlayerShortVersion;
    isCorrect: boolean;
    gameId?: string;
  }) => Promise<void>;
  fetchStats: (date: string) => void;
}

const GuessStatsContext = createContext<ContextProps>({
  stats: {},
  putGuess: (...args: any[]) => Promise.resolve(),
  fetchStats: (date: string) => {},
});

const updateStats = (
  prev: Record<string, TeamPairGuesses | undefined>,
  key: string,
  guessedPlayer: PlayerShortVersion,
  isCorrect: boolean
) => {
  const item = prev[key];

  if (!item) {
    return prev;
  }

  const newItem = {
    ...item,
    guessedPlayers: {
      ...(item?.guessedPlayers ?? {}),
      [guessedPlayer.person]: {
        name: guessedPlayer.name,
        person: guessedPlayer.person,
        isCorrect: isCorrect,
        numOfGuesses:
          (item?.guessedPlayers[guessedPlayer.person]?.numOfGuesses || 0) + 1,
      },
    },
    totalGuesses: (item?.totalGuesses || 0) + 1,
  };
  return {
    ...prev,
    [key]: newItem,
  };
};

export const GuessStatsContextProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [stats, setStats] = React.useState<
    Record<string, TeamPairGuesses | undefined>
  >({});

  const fetchStats = useCallback(async (date?: string) => {
    if (!date) {
      console.error("no date");
      return;
    }
    const urlDate = date.replaceAll(".", "-");
    const response = await fetch(`${restAPI}guesses/by-date/${urlDate}`);
    const result = (await response.json()) as TeamPairGuesses[];

    const statsObject: Record<string, TeamPairGuesses | undefined> = {};

    result.forEach((r) => {
      const key = `${r.teamPair}-${date}`;
      statsObject[key] = r;
    });

    setStats(statsObject);
  }, []);

  const putGuess = async ({
    date,
    teamPair,
    guessedPlayer,
    isCorrect,
    gameId,
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

    setStats((prev) => updateStats(prev, key, guessedPlayer, isCorrect));

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
    fetch(
      `${restAPI}guesses/by-date-and-team-pair/${urlDate}/${teamPair}`,
      requestOptions
    );
  };

  return (
    <GuessStatsContext.Provider value={{ putGuess, stats, fetchStats }}>
      {children}
    </GuessStatsContext.Provider>
  );
};

export const useGuessStatsContext = () => {
  const context = useContext(GuessStatsContext);

  if (!context) throw new Error("Missing GuessStatsContext");

  return context;
};
