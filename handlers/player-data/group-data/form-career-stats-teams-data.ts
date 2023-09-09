import { Player, TeamPairPlayers } from "../../../types";

const careerMilestones = [
  {
    name: "400points",
    key: "points",
    value: 400,
  },
  {
    name: "600games",
    key: "games",
    value: 600,
  },
  {
    name: "300assists",
    key: "assists",
    value: 300,
  },
  {
    name: "500penaltyMinutes",
    key: "penaltyMinutes",
    value: 500,
  },
  {
    name: "200goals",
    key: "goals",
    value: 200,
  },
  {
    name: "200plusMinus",
    key: "plusMinus",
    value: 200,
  },
];

export const uniqueBy = <T>(arr: T[], getId: (i: T) => string): T[] => {
  const uniqueItems: Record<string, T> = {};

  arr.forEach((item) => {
    const id = getId(item);
    const existing = uniqueItems[id];

    if (!existing) {
      uniqueItems[id] = item;
    }
  });

  return Object.values(uniqueItems);
};

export const formPlayerCareerMilestoneData = (
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

  careerMilestones.forEach((milestone) => {
    players.forEach((player) => {
      const value = player[milestone.key as keyof Player] as number;

      if (value == null) {
        console.log(JSON.stringify(player, null, 2));
        console.log("invalid param: " + milestone.key);
        return;
      }

      if (value >= milestone.value) {
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
