export type Player = {
  person: string;
  dateOfBirth: string;
  teams: string[];
  name: string;
  id?: number;
  seasons: {
    [teamName: string]: number[];
  };
  games: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;
  plusMinus: number;
  shots: number;
};

export type PlayerShortVersion = Pick<
  Player,
  "person" | "name" | "dateOfBirth"
>;

export type TeamPairPlayers = {
  teamPair: string;
  players: { person: string }[];
};

export type LiigadokuOfTheDay = {
  date: string;
  xTeams: string[];
  yTeams: string[];
};

export type NewGame = {
  gameId: string;
  date: string;
}