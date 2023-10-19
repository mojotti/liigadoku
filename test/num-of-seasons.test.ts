import { formNumberOfSeasonsPerPlayer } from "../handlers/player-data/group-data/form-player-num-of-seasons";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";

describe("Number of seasons per player", () => {
  it("handles number of seasons per player", () => {
    const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

    const data = formNumberOfSeasonsPerPlayer(Object.values(formattedPlayerData));

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });
});
