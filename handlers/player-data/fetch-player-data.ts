import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  PlayerSeason,
  fetchPlayerProfileData,
  fetchPreSeasonData,
  fetchRunkosarjaPlayerIds,
  formPlayerTeamsData,
  groupPlayers,
  playerToShortVersion,
  putInBatches,
  uniqueBy,
} from "./player-data-helpers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Player } from "../../types";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

const {
  PERSON_TABLE,
  PLAYERS_TABLE,
  TEAM_PAIRS_TABLE,
  PLAYER_NAMES_TABLE,
  PROFILE_BUCKET,
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

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

const s3client = new S3Client({ region: "eu-north-1" });

const toPlayerName = (players: Player[]) =>
  players
    .sort((p1, p2) => {
      const p1Split = p1.name.split(" ");
      const p2Split = p2.name.split(" ");

      const firstName1 = p1Split[0];
      const lastName1 = p1Split[p1Split.length - 1];

      const firstName2 = p2Split[0];
      const lastName2 = p2Split[p2Split.length - 1];

      if (!lastName1 || !lastName2 || !firstName1 || !firstName2) {
        return 0;
      }

      if (lastName1 === lastName2) {
        return firstName1.localeCompare(firstName2);
      }

      return lastName1.localeCompare(lastName2);
    })
    .map(playerToShortVersion);

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

    const playerNames = toPlayerName(players);

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
