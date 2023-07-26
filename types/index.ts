export type Player = {
  person: string;
  dateOfBirth: string;
  teams: string[];
  name: string;
  seasons: {
    [teamName: string]: number[];
  };
};

export type PlayerShortVersion = Pick<Player, "person" | "name">;

export type TeamPairPlayers = {
  teamPair: string;
  players: PlayerShortVersion[];
};
