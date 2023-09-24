import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { authorize, buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
import { NewGame } from "../types";
import { randomUUID } from "crypto";

const { ONGOING_GAMES_TABLE } = process.env;

if (!ONGOING_GAMES_TABLE) {
  throw new Error("ONGOING_GAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getNewGame = async ({
  headers,
  pathParameters,
}: APIGatewayProxyEvent) => {
  await authorize(headers);

  if (!pathParameters?.date) {
    return buildResponseBody(400, "date is required");
  }

  const date = pathParameters.date.replace(/\-/g, ".");
  const uuid = randomUUID();

  const Item = {
    date,
    uuid,
    teamPairs: []
  };

  try {
    await dynamoDb.put({
      TableName: ONGOING_GAMES_TABLE,
      Item,
    });

    return buildResponseBody(
      200,
      JSON.stringify({
        date,
        gameId: uuid,
      } as NewGame)
    );
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
