import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  fetchPlayerProfileData,
  fetchPreSeasonData,
  fetchRunkosarjaPlayerIds,
  putInBatches,
} from "./player-data-helpers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PlayerSeason } from "../../types";
import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { filterDuplicatePlayers } from "./utils/filter-duplicate-players";
import { formPlayerCareerMilestoneData } from "./group-data/form-career-stats-teams-data";
import { groupPlayers } from "./utils/group-players";
import { formPlayerTeamsData } from "./group-data/form-player-teams-data";
import { formPlayerSeasonMilestoneData } from "./group-data/form-season-stats-teams-data";
import { toPlayerName } from "./utils/players";

const {
  PERSON_TABLE,
  PLAYERS_TABLE,
  TEAM_PAIRS_TABLE,
  PLAYER_NAMES_TABLE,
  PROFILE_BUCKET,
  MILESTONE_TEAM_TABLE,
} = process.env;

if (!PLAYERS_TABLE) {
  throw new Error("PLAYERS_TABLE not defined");
}

if (!TEAM_PAIRS_TABLE) {
  throw new Error("TEAM_PAIRS_TABLE not defined");
}

if (!PLAYER_NAMES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

if (!PROFILE_BUCKET) {
  throw new Error("PROFILE_BUCKET not defined");
}

if (!PERSON_TABLE) {
  throw new Error("PERSON_TABLE not defined");
}

if (!MILESTONE_TEAM_TABLE) {
  throw new Error("MILESTONE_TEAM_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const s3client = new S3Client({ region: "eu-north-1" });

const FETCH_ALL_THE_PLAYER_DATA = false;
const PLAYER_PROFILES_JSON = "player-profiles.json";

export const handler = async (_event: any) => {
  try {
    // 2023-2024 pre-season
    const preSeasonData = await fetchPreSeasonData(2024);
    // seasons 1975-2023

    let profiles: PlayerSeason[];

    if (FETCH_ALL_THE_PLAYER_DATA) {
      const playerIds = await fetchRunkosarjaPlayerIds(1975, 2023);
      profiles = await fetchPlayerProfileData([...new Set(playerIds)]);

      try {
        const input: PutObjectCommandInput = {
          Bucket: PROFILE_BUCKET,
          Key: PLAYER_PROFILES_JSON,
          Body: JSON.stringify(profiles),
          ContentType: "application/json",
        };
        const putCommand = new PutObjectCommand(input);
        const response = await s3client.send(putCommand);
        console.log({ response });
      } catch (err) {
        console.error(err);
        throw err;
      }
    } else {
      // Get profile data from S3
      try {
        const output = await s3client.send(
          new GetObjectCommand({
            Bucket: PROFILE_BUCKET,
            Key: PLAYER_PROFILES_JSON,
          })
        );
        const jsonString = await output.Body?.transformToString();
        profiles = JSON.parse(jsonString ?? "") as PlayerSeason[];

        if (!profiles) {
          throw new Error("No profiles.");
        }
      } catch (error) {
        console.error("error parsing json", error);
        throw error;
      }
    }

    const players = Object.values(
      groupPlayers([...profiles, ...preSeasonData])
    );

    const playerNames = filterDuplicatePlayers(toPlayerName(players));

    console.log("Inserting players in batches...");
    await putInBatches(dynamoDb, PLAYERS_TABLE, players);
    console.log("Inserted players in batches!");

    console.log("Inserting player names");

    const playersFirstHalf = playerNames.slice(0, players.length / 2);
    const playersSecondHalf = playerNames.slice(players.length / 2);

    await dynamoDb.put({
      TableName: PLAYER_NAMES_TABLE,
      Item: {
        all: "all",
        players: playersFirstHalf,
      },
    });

    await dynamoDb.put({
      TableName: PLAYER_NAMES_TABLE,
      Item: {
        all: "all2",
        players: playersSecondHalf,
      },
    });
    console.log("Inserted player names!");

    console.log("Inserting team pairs in batches...");
    await putInBatches(
      dynamoDb,
      TEAM_PAIRS_TABLE,
      formPlayerTeamsData(players)
    );
    console.log("Inserted team pairs in batches!");

    console.log("Inserting milestone - team pairs in batches...");
    await putInBatches(
      dynamoDb,
      MILESTONE_TEAM_TABLE,
      formPlayerCareerMilestoneData(players)
    );

    await putInBatches(
      dynamoDb,
      MILESTONE_TEAM_TABLE,
      formPlayerSeasonMilestoneData(profiles)
    );
    console.log("Inserted milestone - team pairs in batches!");

    console.log("Inserting person data in batches...");
    await putInBatches(dynamoDb, PERSON_TABLE, playerNames);
    console.log("Inserted person data in batches");

    console.log("Done!");
  } catch (e) {
    console.log("Error", e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
  return {
    statusCode: 200,
    body: "ok",
  };
};
