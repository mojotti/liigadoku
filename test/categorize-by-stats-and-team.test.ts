import { filterDuplicatePlayers } from "../handlers/player-data/filter-duplicate-players";
import { formPlayerMilestoneData } from "../handlers/player-data/form-stat-teams-data";
import { groupPlayers } from "../handlers/player-data/group-players";
import { PlayerSeason } from "../handlers/player-data/player-data-helpers";
import playerProfiles from "../handlers/player-data/player-profiles.json";

const findDuplicates = (arr: string[]) =>
  arr.filter((e, i, a) => a.indexOf(e) !== i);

describe("Categorize by stats and team", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handle categorization", () => {
    const data = formPlayerMilestoneData(Object.values(formattedPlayerData));

    // console.log({ data: JSON.stringify(data, null, 2) });
  });

  // it("checks that filtered players have no data", () => {
  //   const data = Object.values(formattedPlayerData);
  //   const players = data.map(
  //     (player) => `${player.name}-${player.dateOfBirth}`
  //   );
  //   const potentialDoubles = findDuplicates(players);

  //   const duplicates = data.filter((d) =>
  //     potentialDoubles.includes(`${d.name}-${d.dateOfBirth}`)
  //   );

  //   filterDuplicatePlayers(duplicates)
  //     .sort((a, b) => a.name.localeCompare(b.name))
  //     // .slice(0, 20)
  //     .forEach((d) => console.log(d));
  // });
});
