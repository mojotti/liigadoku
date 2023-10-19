import { Player, TeamPairPlayers } from "../../../types";

const categories = [
  {
    name: "5Teams",
    numOfTeams: 5,
  },
  {
    name: "6Teams",
    numOfTeams: 6,
  },
  {
    name: "7Teams",
    numOfTeams: 7,
  },
  {
    name: "8Teams",
    numOfTeams: 8,
  },
];

export const formNumberOfTeamsPerPlayer = (
  players: Player[]
): TeamPairPlayers[] => {
  const milestonesByTeam: Record<
    string,
    {
      players: {
        person: string;
        name?: string;
      }[];
    }
  > = {};

  players.forEach((player) => {
    categories.forEach((category) => {
      const playerNumOfTeams = player.teams.filter(
        (t) => t !== "Olympia-84"
      ).length;

      if (playerNumOfTeams >= category.numOfTeams) {
        player.teams.forEach((team) => {
          const key = `${category.name}-${team}`;

          milestonesByTeam[key] = {
            players: [
              ...(milestonesByTeam[key]?.players || []),
              { person: player.person, name: player.name },
            ],
          };
        });
      }
    });
  });

  return Object.entries(milestonesByTeam).map(([teamPair, { players }]) => ({
    teamPair,
    players,
  }));
};
