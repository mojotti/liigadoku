import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";



describe("formatPlayerData", () => {
  it("should get stats right", () => {
    const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

    expect(formattedPlayerData).toMatchSnapshot(); 
  });
});
