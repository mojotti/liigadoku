import { Player, PlayerSeason } from "../../../types";
import { mapTeamName } from "./teams";

export const groupPlayers = (
  playersBySeasons: PlayerSeason[]
): Record<string, Player> => {
  const players: Record<string, Player> = {};

  playersBySeasons.forEach(
    ({
      person,
      dateOfBirth,
      teamName: teamNameRaw,
      name,
      season,
      id,
      ...rest
    }) => {
      const teamName = mapTeamName(teamNameRaw);
      const hit = players[person];
      if (!hit) {
        players[person] = {
          person,
          dateOfBirth,
          teams: [teamName],
          name,
          seasons: { [teamName]: [season] },
          id,
          games: rest.games,
          goals: rest.goals,
          assists: rest.assists,
          points: rest.points,
          penaltyMinutes: rest.penaltyMinutes,
          plusMinus: rest.plusMinus,
          shots: rest.shots,
        };
        return;
      }

      const teamsAndSeasons: {
        seasons: Record<string, number[]>;
        teams: string[];
      } = {
        seasons: {},
        teams: [],
      };

      if (!hit.teams.includes(teamName)) {
        teamsAndSeasons.teams = [...hit.teams, teamName];
        teamsAndSeasons.seasons = { ...hit.seasons, [teamName]: [season] };
      } else {
        teamsAndSeasons.teams = hit.teams;
        teamsAndSeasons.seasons = {
          ...hit.seasons,
          [teamName]: [...new Set([...hit.seasons[teamName], season])],
        };
      }

      players[person] = {
        ...teamsAndSeasons,
        person,
        dateOfBirth,
        name,
        id,
        games: (hit.games || 0) + (rest.games || 0),
        goals: (hit.goals || 0) + (rest.goals || 0),
        assists: (hit.assists || 0) + (rest.assists || 0),
        points: (hit.points || 0) + (rest.points || 0),
        penaltyMinutes: (hit.penaltyMinutes || 0) + (rest.penaltyMinutes || 0),
        plusMinus: (hit.plusMinus || 0) + (rest.plusMinus || 0),
        shots: (hit.shots || 0) + (rest.shots || 0),
      };
    }
  );

  return players;
};
