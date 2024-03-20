import playerProfiles from "../handlers/player-data/player-profiles.json";
import playerProfilesOld from "../handlers/player-data/player-profiles-old.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { getPlayerList } from "../handlers/player-data/utils/players";
import { PlayerSeason } from "../types";

const findDuplicates = (arr: string[]) =>
  arr.filter((e, i, a) => a.indexOf(e) !== i);

describe("Player list", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles player teams data", () => {
    const data = getPlayerList(Object.values(formattedPlayerData));

    console.log("Player list length", data.length);

    console.log("Tomas plihal", data.find((d) => d.name === "Tomas Plihal"));

    expect(data.length).toBeGreaterThan(0)
    expect(data).toMatchSnapshot();
  });

  it("checks which players are missing in new player data", () => { 
    const oldData = groupPlayers(playerProfilesOld as PlayerSeason[]);

    const oldPlayers = Object.values(oldData).map((d) => `${d.name}-${d.dateOfBirth}`);
    const newPlayers = Object.values(formattedPlayerData).map((d) => `${d.name}-${d.dateOfBirth}`);

    const missing = oldPlayers.filter((p) => !newPlayers.includes(p));

    console.log({ missing });

    expect(missing.length).toBeGreaterThan(0);
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

    console.log({ duplicates });

    const filtered = getPlayerList(data);

    const filteredDuplicates = findDuplicates(
      filtered.map((f) => `${f.name}-${f.dateOfBirth}`)
    );

    console.log({ filteredDuplicates });
    expect(filteredDuplicates.length).toBe(0);
  });
});
