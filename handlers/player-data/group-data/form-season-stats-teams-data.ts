import { PlayerSeason, TeamPairPlayers } from "../../../types";
import { mapTeamName } from "../utils/teams";

const seasonMilestones = [
  {
    name: "50pointsSeason",
    key: "points",
    value: 50,
  },
  {
    name: "60pointsSeason",
    key: "points",
    value: 60,
  },
  {
    name: "40assistsSeason",
    key: "assists",
    value: 40,
  },
  {
    name: "35assistsSeason",
    key: "assists",
    value: 35,
  },
  {
    name: "30assistsSeason",
    key: "assists",
    value: 30,
  },
  {
    name: "100penaltyMinutesSeason",
    key: "penaltyMinutes",
    value: 100,
  },
  {
    name: "150penaltyMinutesSeason",
    key: "penaltyMinutes",
    value: 150,
  },
  {
    name: "30goalsSeason",
    key: "goals",
    value: 30,
  },
  {
    name: "25goalsSeason",
    key: "goals",
    value: 25,
  },
  {
    name: "20goalsSeason",
    key: "goals",
    value: 20,
  },
];

export const formPlayerSeasonMilestoneData = (
  players: PlayerSeason[]
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

  seasonMilestones.forEach((milestone) => {
    players.forEach((player) => {
      const value = player[milestone.key as keyof PlayerSeason] as number;

      if (value == null) {
        console.log(JSON.stringify(player, null, 2));
        console.log("invalid param: " + milestone.key);
        return;
      }

      const teamName = mapTeamName(player.teamName);

      if (value >= milestone.value) {
        const key = `${milestone.name}-${teamName}`;
        if (milestonesByTeam[key]) {
          if (
            milestonesByTeam[key].players.some(
              (p) => p.person === player.person
            )
          ) {
            return;
          }
          milestonesByTeam[key].players = [
            ...(milestonesByTeam[key]?.players || []),
            { person: player.person, name: player.name },
          ];
        } else {
          milestonesByTeam[key] = {
            players: [{ person: player.person, name: player.name }],
          };
        }
      }
    });
  });

  return Object.entries(milestonesByTeam).map(([teamPair, { players }]) => ({
    teamPair,
    players,
  }));
};
