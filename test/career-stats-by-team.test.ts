import { formPlayerCareerMilestoneData } from "../handlers/player-data/group-data/form-career-stats-teams-data";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { filterDuplicatePlayers } from "../handlers/player-data/utils/filter-duplicate-players";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";

const findDuplicates = (arr: string[]) =>
  arr.filter((e, i, a) => a.indexOf(e) !== i);

describe("Career stats and team", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles career milestones", () => {
    const data = formPlayerCareerMilestoneData(
      Object.values(formattedPlayerData)
    );

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });

  it("checks there are no duplicates", () => {
    const data = Object.values(formattedPlayerData);
    const players = data.map(
      (player) => `${player.name}-${player.dateOfBirth}`
    );
    const potentialDoubles = findDuplicates(players);

    const duplicates = data.filter((d) =>
      potentialDoubles.includes(`${d.name}-${d.dateOfBirth}`)
    );

    expect(duplicates.length).toBeGreaterThan(0);

    const filtered = filterDuplicatePlayers(data);
    const diff = data.length - filtered.length;
    expect(diff).toBe(duplicates.length / 2);
  });
});
