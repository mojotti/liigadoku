import playerProfiles from "../handlers/player-data/player-profiles.json";
import { groupPlayers } from "../handlers/player-data/utils/group-players";
import { PlayerSeason } from "../types";

const joonasKemppainen = "5d67bf7f-4e23-5b71-9ac7-9d608cf017db";
const juhaniTamminen = "2c052d2a-5545-5ca8-b50b-38e16eff7873";
const juhaHuikari = "b43743d2-19ea-59e9-8aff-a0088ee7a6b4";
const sinuheWallinheimo = "e259ed3f-4d06-5e4c-ae7d-e7e6973cd0ff";
const artoLaatikainen = "05822193-cc04-5d66-83c5-9c39fc869142";
const erikKakko = "4daa1cdb-062f-57a7-9a55-a8f12841814f";
const hannuJortikka = "77356c1b-9cfc-582a-b493-f44ae8c87f91";
const eeroSomervuori = "d9dcd111-cd2b-5a86-8755-73653dcf6658";
const kariJalonen = "283b0e3d-b635-5ba0-a4c9-be88b903f931";
const mattiHagman = "7a895db5-8244-5b98-9087-be060f7385fc";

const expectedStats = {
  [joonasKemppainen]: {
    games: 533,
    goals: 79,
    assists: 120,
    points: 199,
    penaltyMinutes: 141,
    plusMinus: 48,
    shots: 1025,
  },
  [juhaniTamminen]: {
    games: 156,
    goals: 75,
    assists: 90,
    points: 165,
    penaltyMinutes: 98,
    plusMinus: 46,
    shots: 0,
  },
  [juhaHuikari]: {
    games: 421,
    goals: 122,
    assists: 126,
    points: 248,
    penaltyMinutes: 503,
    plusMinus: 168,
    shots: 0,
  },
  [sinuheWallinheimo]: {
    games: 250,
    goals: 0,
    assists: 3,
    points: 3,
    penaltyMinutes: 196,
    plusMinus: 0,
    shots: 0,
  },
  [artoLaatikainen]: {
    games: 1024,
    goals: 83,
    assists: 256,
    points: 339,
    penaltyMinutes: 650,
    plusMinus: 60,
    shots: 2836,
  },
  [erikKakko]: {
    games: 708,
    goals: 74,
    assists: 126,
    points: 200,
    penaltyMinutes: 426,
    plusMinus: -37,
    shots: 1019,
  },
  [hannuJortikka]: {
    games: 121,
    goals: 6,
    assists: 17,
    points: 23,
    penaltyMinutes: 112,
    plusMinus: 11,
    shots: 0,
  },
  [eeroSomervuori]: {
    games: 729,
    goals: 164,
    assists: 190,
    points: 354,
    penaltyMinutes: 286,
    plusMinus: 44,
    shots: 2308,
  },
  [kariJalonen]: {
    games: 422,
    goals: 190,
    assists: 360,
    points: 550,
    penaltyMinutes: 281,
    plusMinus: 117,
    shots: 0,
  },
  [mattiHagman]: {
    games: 432,
    goals: 217,
    assists: 432,
    points: 649,
    penaltyMinutes: 368,
    plusMinus: 168,
    shots: 0,
  },
};

describe("formatPlayerData", () => {
  it("should get stats right", () => {
    const formattedPlayerData = groupPlayers(playerProfiles as PlayerSeason[]);

    Object.entries(expectedStats).forEach(([playerId, expectedStats]) => {
      const player = formattedPlayerData[playerId];
      expect(player).toBeDefined();
      expect(player).toMatchObject(expectedStats);
    });
  });
});
