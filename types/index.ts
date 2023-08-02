export type Player = {
  person: string;
  dateOfBirth: string;
  teams: string[];
  name: string;
  id?: number;
  seasons: {
    [teamName: string]: number[];
  };
};

export type PlayerShortVersion = Pick<Player, "person" | "name" | "dateOfBirth">;

export type TeamPairPlayers = {
  teamPair: string;
  players: PlayerShortVersion[];
};
