import { Player, TeamPairPlayers } from "../../../types";

const categories = [
  {
    name: "10Seasons",
    numOfSeasons: 10,
  },
  {
    name: "12Seasons",
    numOfSeasons: 12,
  },
  {
    name: "14Seasons",
    numOfSeasons: 14,
  },
  {
    name: "15Seasons",
    numOfSeasons: 15,
  },
];

export const formNumberOfSeasonsPerPlayer = (
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
      const playerNumOfSeasons = [
        ...new Set(Object.values(player.seasons).flat()),
      ].length;

      if (playerNumOfSeasons >= category.numOfSeasons) {
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
