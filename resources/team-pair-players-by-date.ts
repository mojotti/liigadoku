import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { authorize, buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getTeamPairData } from "../lib/team-pair";
import { formatInTimeZone } from "date-fns-tz";
import { LiigadokuOfTheDay } from "../types";

const { LIIGADOKU_GAMES_TABLE } = process.env;

if (!LIIGADOKU_GAMES_TABLE) {
  throw new Error("LIIGADOKU_GAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);


const formMatchUps = (doku: LiigadokuOfTheDay) =>
  doku.xTeams
    .map((xTeam, i) =>
      doku.yTeams.map((yTeam, j) => ({
        teams: [xTeam, yTeam].sort(),
      }))
    )
    .flat();

export const getTeamPairPlayersByDate = async ({
  headers,
  pathParameters,
}: APIGatewayProxyEvent) => {
  await authorize(headers);

  if (!pathParameters?.date) {
    return buildResponseBody(400, "date is required");
  }

  const date = pathParameters.date.replace(/\-/g, ".");

  try {
    const { Item: liigadokuOfTheDay } = await dynamoDb.get({
      TableName: LIIGADOKU_GAMES_TABLE,
      Key: {
        date,
      },
    });

    if (!liigadokuOfTheDay) {
      return buildResponseBody(404, "No game found for the date");
    }

    const matchUps = formMatchUps(liigadokuOfTheDay as LiigadokuOfTheDay);

    const promises = matchUps.map((matchUp) => {
      const teams = matchUp.teams.join("-");

      return getTeamPairData(teams, dynamoDb);
    });

    const resps = await Promise.all(promises);

    const answers: Record<string, { person: string }[]> = {};
    resps.forEach((resp) => {
      answers[resp.teamPair] = resp.players;
    });

    return buildResponseBody(200, JSON.stringify(answers));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
