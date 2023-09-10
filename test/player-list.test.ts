import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { getPlayerList } from "../handlers/player-data/utils/players";
import { PlayerSeason } from "../types";

describe("Player list", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles player teams data", () => {
    const data = getPlayerList(
      Object.values(formattedPlayerData)
    );

    expect(data).toMatchSnapshot();
  });
});
