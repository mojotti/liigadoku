import { formPlayerCareerMilestoneData } from "../handlers/player-data/group-data/form-career-stats-teams-data";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";


describe("Career stats and team", () => {
  const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

  it("handles career milestones", () => {
    const data = formPlayerCareerMilestoneData(
      Object.values(formattedPlayerData)
    );

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });
});
