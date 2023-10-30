import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { authorize, buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
import { LiigadokuOfTheDay } from "../types";
import formatInTimeZone from "date-fns-tz/formatInTimeZone";
import { subDays } from "date-fns";
import { getTeamsIn2000s } from "../handlers/player-data/utils/teams";
import { getRandomMilestone } from "../lib/utils";
import { getTeamPairData, isValidTeamPair } from "../lib/team-pair";

const { LIIGADOKU_GAMES_TABLE } = process.env;

if (!LIIGADOKU_GAMES_TABLE) {
  throw new Error("LIIGADOKU_GAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

const tz = "Europe/Helsinki";

const getRandomTeams = (teams: string[], yesterdaysTeams: string[]) => {
  const teamsForToday = teams.filter((t) => !yesterdaysTeams.includes(t));
  const shuffled = teamsForToday.sort(() => 0.5 - Math.random());

  return {
    xTeams: [...shuffled.slice(0, 2), getRandomMilestone()],
    yTeams: shuffled.slice(3, 6),
  };
};

const getTeams = async (yesterdayTeams: string[]) => {
  let isValidLiigadoku = false;
  let xTeams: string[] = [],
    yTeams: string[] = [];
  const teams = getTeamsIn2000s();

  while (!isValidLiigadoku) {
    const { xTeams: x, yTeams: y } = getRandomTeams(teams, yesterdayTeams);
    const teamPairs = [
      [x[0], y[0]].sort().join("-"),
      [x[0], y[1]].sort().join("-"),
      [x[0], y[2]].sort().join("-"),
      [x[1], y[0]].sort().join("-"),
      [x[1], y[1]].sort().join("-"),
      [x[1], y[2]].sort().join("-"),
      [x[2], y[0]].sort().join("-"),
      [x[2], y[1]].sort().join("-"),
      [x[2], y[2]].sort().join("-"),
    ];

    console.log({ teamPairs });

    const gameTeamPairs = await Promise.all(
      teamPairs.map((t) => getTeamPairData(t, dynamoDb))
    );
    isValidLiigadoku = gameTeamPairs.every(isValidTeamPair);

    console.log({ isValidLiigadoku });

    if (isValidLiigadoku) {
      xTeams = x;
      yTeams = y;
    }
  }

  return { xTeams, yTeams };
};

export const getLiigadokuOfTheDay = async ({
  headers,
}: APIGatewayProxyEvent) => {
  await authorize(headers);

  console.log({ date: new Date().toISOString() });
  const helsinkiDate = formatInTimeZone(new Date(), tz, "dd.MM.yyyy");

  try {
    const { Item: liigadokuOfTheDay } = await dynamoDb.get({
      TableName: LIIGADOKU_GAMES_TABLE,
      Key: {
        date: helsinkiDate,
      },
    });

    if (!liigadokuOfTheDay) {
      const yesterdayHelsinkiTime = formatInTimeZone(
        subDays(new Date(), 1),
        tz,
        "dd.MM.yyyy"
      );

      const { Item: yesterdaysLiigadoku } = await dynamoDb.get({
        TableName: LIIGADOKU_GAMES_TABLE,
        Key: {
          date: yesterdayHelsinkiTime,
        },
      });

      const yesterdayTeams = yesterdaysLiigadoku
        ? [
            ...(yesterdaysLiigadoku as LiigadokuOfTheDay).xTeams,
            ...(yesterdaysLiigadoku as LiigadokuOfTheDay).yTeams,
          ].flat()
        : [];

      const { xTeams, yTeams } = await getTeams(yesterdayTeams);

      await dynamoDb.put({
        TableName: LIIGADOKU_GAMES_TABLE,
        Item: {
          date: helsinkiDate,
          xTeams,
          yTeams,
        } as LiigadokuOfTheDay,
      });

      return buildResponseBody(
        200,
        JSON.stringify({
          date: helsinkiDate,
          xTeams,
          yTeams,
        } as LiigadokuOfTheDay)
      );
    }

    return buildResponseBody(
      200,
      JSON.stringify(liigadokuOfTheDay as LiigadokuOfTheDay)
    );
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
