import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { GUESSES_TABLE } = process.env;

if (!GUESSES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getGuessesByDateAndTeamPair = async ({
  pathParameters,
}: APIGatewayProxyEvent) => {
  if (!pathParameters?.teamPair) {
    return buildResponseBody(400, "teamPair is required");
  }

  if (!pathParameters?.date) {
    return buildResponseBody(400, "date is required");
  }

  const teamPair = decodeURI(pathParameters.teamPair);
  const date = pathParameters.date.replace(/\-/g, ".");

  try {
    const { Item: guesses } = await dynamoDb.get({
      TableName: GUESSES_TABLE,
      Key: {
        teamPair,
        date,
      },
    });

    return buildResponseBody(200, JSON.stringify(guesses));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
