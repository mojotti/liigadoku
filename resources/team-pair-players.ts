import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getTeamPairData } from "../lib/team-pair";

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
    const teamPair = decodeURI(pathParameters.teamPair);

    const players = await getTeamPairData(teamPair, dynamoDb);

    console.log("team pairs players:" + JSON.stringify(players));

    return buildResponseBody(200, JSON.stringify(players));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
