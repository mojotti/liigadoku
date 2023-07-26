import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { TEAM_PAIRS_TABLE } = process.env;

if (!TEAM_PAIRS_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getTeamPairPlayers = async ({
  pathParameters,
}: APIGatewayProxyEvent) => {
  console.log({ pathParameters });

  if (!pathParameters?.teamPair) {
    return buildResponseBody(400, "teamPair is required");
  }

  try {
    const players = await dynamoDb.get({
      TableName: TEAM_PAIRS_TABLE,
      Key: {
        teamPair: decodeURI(pathParameters.teamPair),
      },
    });

    return buildResponseBody(200, JSON.stringify(players.Item));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
