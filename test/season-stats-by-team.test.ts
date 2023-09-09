import { formPlayerSeasonMilestoneData } from "../handlers/player-data/group-data/form-season-stats-teams-data";
import playerProfiles from "../handlers/player-data/player-profiles.json";
import { PlayerSeason } from "../types";

describe("Season stats and team", () => {
  it("handles season milestones", () => {
    const data = formPlayerSeasonMilestoneData(
      playerProfiles as PlayerSeason[]
    );

    expect(JSON.stringify(data, null, 4)).toMatchSnapshot();
  });
});
