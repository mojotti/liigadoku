import { Player, TeamPairPlayers } from "../../types";

const milestones = [
  {
    name: "400points",
    key: "points",
    value: 400,
  },
];

export const formPlayerMilestoneData = (
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

  milestones.forEach((milestone) => {
    players.forEach((player) => {
      const value = player[milestone.key as keyof Player] as number;

      if (value == null) {
        console.log(JSON.stringify(player, null, 2));
        console.log("invalid param: " + milestone.key);
        return;
      }

      if (value > milestone.value) {
        player.teams.forEach((team) => {
          const key = `${milestone.name}-${team}`;
          if (milestonesByTeam[key]) {
            milestonesByTeam[key].players = [
              ...(milestonesByTeam[key]?.players || []),
              { person: player.person, name: player.name },
            ];
          } else {
            milestonesByTeam[key] = {
              players: [{ person: player.person, name: player.name }],
            };
          }
        });
      }
    });
  });

  return Object.entries(milestonesByTeam).map(([teamPair, { players }]) => ({
    teamPair,
    players,
  }));
};
