import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { PLAYER_NAMES_TABLE } = process.env;

if (!PLAYER_NAMES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getAllPlayers = async (_event: APIGatewayProxyEvent) => {
  try {
    const players = await dynamoDb.get({
      TableName: PLAYER_NAMES_TABLE,
      Key: {
        all: "all",
      },
    });

    return buildResponseBody(200, JSON.stringify(players.Item));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
