import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { authorize, buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { PLAYER_NAMES_TABLE } = process.env;

if (!PLAYER_NAMES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getAllPlayers = async ({ headers }: APIGatewayProxyEvent) => {
  await authorize(headers);

  try {
    const [firstPart, secondPart] = await Promise.all([
      dynamoDb.get({
        TableName: PLAYER_NAMES_TABLE,
        Key: {
          all: "all",
        },
      }),
      dynamoDb.get({
        TableName: PLAYER_NAMES_TABLE,
        Key: {
          all: "all2",
        },
      }),
    ]);

    const players = [
      ...(firstPart.Item?.players ?? []),
      ...(secondPart.Item?.players ?? []),
    ].filter(Boolean);

    return buildResponseBody(200, JSON.stringify({ players }));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
