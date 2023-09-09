import { formPlayerTeamsData } from "../handlers/player-data/group-data/form-player-teams-data";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";

describe("Player teams data", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles player teams data", () => {
    const data = formPlayerTeamsData(
      Object.values(formattedPlayerData)
    );

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });
});
