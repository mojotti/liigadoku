import React, { createContext, FC, PropsWithChildren, useContext } from "react";
import {
  LiigadokuOfTheDay,
  NewGame,
  PlayerShortVersion,
  TeamPairPlayers,
} from "../../../types";
import { useAsync } from "react-use";

const restAPI = process.env.REACT_APP_REST_API_ENDPOINT;

interface ContextProps {
  dokuOfTheDay?: LiigadokuOfTheDay;
  players?: PlayerShortVersion[];
  isLoadingInitData: boolean;
  answers?: Record<string, { person: string }[]>;
  gameId?: string;
}

const GameInitContext = createContext<ContextProps>({
  dokuOfTheDay: undefined,
  players: undefined,
  isLoadingInitData: true,
  answers: {},
  gameId: "",
});

const formMatchUps = (doku: LiigadokuOfTheDay) =>
  doku.xTeams
    .map((xTeam, i) =>
      doku.yTeams.map((yTeam, j) => ({
        key: `xTeam${i}yTeam${j}`,
        teams: [xTeam, yTeam].sort(),
      }))
    )
    .flat();

export const GameInitContextProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [dokuOfTheDay, setDokuOfTheDay] = React.useState<LiigadokuOfTheDay>();
  const [gameId, setGameId] = React.useState<string>();

  const { loading: loadingPlayers, value: players } = useAsync(async () => {
    const response = await fetch(`${restAPI}players/all`);
    const result = await response.json();

    return (result?.players ?? []) as PlayerShortVersion[];
  }, [restAPI]);

  const { loading: loadingTeams, value: answers } = useAsync(async () => {
    const dokuResponse = await fetch(`${restAPI}liigadoku-of-the-day`);
    const dokuJson = await dokuResponse.json();

    setDokuOfTheDay(dokuJson);

    const matchUps = formMatchUps(dokuJson);

    const urlDate = dokuJson.date.replaceAll(".", "-");
    const gameIdResponse = await fetch(`${restAPI}games/new/${urlDate}`);
    const gameIdresult = await gameIdResponse.json();
    setGameId(gameIdresult.gameId);

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
    return answers;
  }, [restAPI]);

  return (
    <GameInitContext.Provider
      value={{
        dokuOfTheDay,
        players,
        isLoadingInitData: loadingTeams,
        answers,
        gameId,
      }}
    >
      {children}
    </GameInitContext.Provider>
  );
};

export const useGameInitContext = () => {
  const context = useContext(GameInitContext);

  if (!context) throw new Error("Missing GameInitContext");

  return context;
};
