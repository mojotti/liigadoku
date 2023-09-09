import { Player, PlayerShortVersion, TeamPairPlayers } from "../../../types";
import { playerToShortVersion } from "../utils/players";
import { getTeamsIn2000sPairs } from "../utils/teams";

export const formPlayerTeamsData = (players: Player[]): TeamPairPlayers[] => {
  const playersByTeam: Record<string, PlayerShortVersion[]> = {};

  players.forEach((player) => {
    player.teams.forEach((team) => {
      playersByTeam[team] = [
        ...(playersByTeam[team] || []),
        playerToShortVersion(player),
      ];
    });
  });

  const teamsIn2000sPairs = getTeamsIn2000sPairs();
  const data: Record<string, PlayerShortVersion[]> = {};

  teamsIn2000sPairs.forEach(([team1, team2]) => {
    const playersInTeam1 = playersByTeam[team1] || [];
    const playersInTeam2 = playersByTeam[team2] || [];

    const playersInBothTeams = playersInTeam1.filter((player) =>
      playersInTeam2.some((p) => p.person === player.person)
    );

    data[`${team1}-${team2}`] = playersInBothTeams;
  });

  return Object.entries(data).map(([teamPair, players]) => ({
    teamPair,
    players: players.map((p) => ({ person: p.person })),
  }));
};
