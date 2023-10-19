import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { getPlayerList } from "../handlers/player-data/utils/players";
import { PlayerSeason } from "../types";

const findDuplicates = (arr: string[]) =>
  arr.filter((e, i, a) => a.indexOf(e) !== i);

describe("Player list", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles player teams data", () => {
    const data = getPlayerList(
      Object.values(formattedPlayerData)
    );

    expect(data).toMatchSnapshot();
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

    const filtered = getPlayerList(data);

    const filteredDuplicates = findDuplicates(
      filtered.map((f) => `${f.name}-${f.dateOfBirth}`)
    );

    console.log({ filteredDuplicates });
    expect(filteredDuplicates.length).toBe(0);
  });
});
