import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
// import { formatInTimeZone } from "date-fns-tz";
import { getTeamsIn2000s } from "../handlers/player-data/player-data-helpers";
import { LiigadokuOfTheDay } from "../types";

const { LIIGADOKU_GAMES_TABLE } = process.env;

if (!LIIGADOKU_GAMES_TABLE) {
  throw new Error("LIIGADOKU_GAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

const tz = "Europe/Helsinki";

const getRandomTeams = (teams: string[]) => {
  const shuffled = teams.sort(() => 0.5 - Math.random());

  return { xTeams: shuffled.slice(0, 3), yTeams: shuffled.slice(3, 6) };
};

export const getLiigadokuOfTheDay = async ({
  pathParameters,
}: APIGatewayProxyEvent) => {
  console.log({ date: new Date().toISOString() });
  const date = new Date().toISOString().slice(0, 10);
  const [year, month, day] = date.split("-");
  const helsinkiDate = `${day}.${month}.${year}`;
  // const helsinkiDate = formatInTimeZone(date, tz, "dd.MM.yyyy");

  try {
    const { Item: liigadokuOfTheDay } = await dynamoDb.get({
      TableName: LIIGADOKU_GAMES_TABLE,
      Key: {
        date: helsinkiDate,
      },
    });

    if (!liigadokuOfTheDay) {
      const teams = getTeamsIn2000s();
      const { xTeams, yTeams } = getRandomTeams(teams);

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

    return buildResponseBody(200, JSON.stringify(liigadokuOfTheDay as LiigadokuOfTheDay));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
