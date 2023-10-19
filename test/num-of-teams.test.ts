import { formNumberOfTeamsPerPlayer } from "../handlers/player-data/group-data/form-player-num-of-teams-data";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";

describe("Number of teams per player", () => {
  it("handles number of teams per player", () => {
    const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

    const data = formNumberOfTeamsPerPlayer(Object.values(formattedPlayerData));

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });
});
