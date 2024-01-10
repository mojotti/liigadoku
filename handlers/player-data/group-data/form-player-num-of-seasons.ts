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
  {
    name: "16Seasons",
    numOfSeasons: 16,
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
      if (player.name === "Pasi Saarela") {
        console.log(JSON.stringify(player, null, 2));
      }
      const playerNumOfSeasons = [
        ...new Set(Object.values(player.seasons).flat()),
      ].length;

      if (player.name === "Pasi Saarela") {
        console.log({playerNumOfSeasons});
      }

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
