import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  fetchPreSeasonData,
  fetchSeasonData,
  formPlayerTeamsData,
  groupPlayers,
  playerToShortVersion,
  putInBatches,
} from "./player-data-helpers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const { PLAYERS_TABLE, TEAM_PAIRS_TABLE, PLAYER_NAMES_TABLE } = process.env;

if (!PLAYERS_TABLE) {
  throw new Error("PLAYERS_TABLE not defined");
}

if (!TEAM_PAIRS_TABLE) {
  throw new Error("TEAM_PAIRS_TABLE not defined");
}

if (!PLAYER_NAMES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (_event: any) => {
  try {
    // 2023-2024 pre-season
    const preSeasonData = await fetchPreSeasonData(2024);
    // console.log("preseason", preSeasonData.slice(0, 10));
    // seasons 1975-2023
    const playerData = await fetchSeasonData(1975, 2023);
    // console.log("player data", playerData.slice(0, 10));

    const players = Object.values(
      groupPlayers([...playerData, ...preSeasonData])
    );

    // console.log("Inserting players in batches...");
    // await putInBatches(dynamoDb, PLAYERS_TABLE, players);
    // console.log("Inserted players in batches!");


    console.log("Inserting player names");
    await dynamoDb.put({
      TableName: PLAYER_NAMES_TABLE,
      Item: {
        all: "all",
        players: players.map(playerToShortVersion),
      },
    });
    console.log("Inserted player names!");

    console.log("Inserting team pairs in batches...");
    await putInBatches(dynamoDb, TEAM_PAIRS_TABLE, formPlayerTeamsData(players));
    console.log("Inserted team pairs in batches!");
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
