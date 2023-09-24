import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { authorize, buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getTeamPairData } from "../lib/team-pair";

const { GUESSES_TABLE, ONGOING_GAMES_TABLE, TEAM_PAIRS_TABLE, PERSON_TABLE } =
  process.env;

if (!GUESSES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}
if (!ONGOING_GAMES_TABLE) {
  throw new Error("ONGOING_GAMES_TABLE not defined");
}
if (!TEAM_PAIRS_TABLE) {
  throw new Error("TEAM_PAIRS_TABLE not defined");
}
if (!PERSON_TABLE) {
  throw new Error("PERSON_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

const isValidBody: (body: any) => boolean = (body) => {
  if (!body.person || typeof body.person !== "string") {
    return false;
  }

  if (!body.gameId || typeof body.gameId !== "string") {
    return false;
  }

  return true;
};

export const putGuess = async ({
  headers,
  pathParameters,
  body: rawBody,
}: APIGatewayProxyEvent) => {
  await authorize(headers);

  const body = rawBody ? JSON.parse(rawBody) : undefined;
  console.log("Put guess:", { pathParameters, body });

  if (!pathParameters?.teamPair) {
    console.log("teamPair is required");
    return buildResponseBody(400, "teamPair is required");
  }

  if (!pathParameters?.date) {
    console.log("date is required");
    return buildResponseBody(400, "date is required");
  }

  if (!body) {
    console.log("body is required");
    return buildResponseBody(400, "body is required");
  }

  if (!isValidBody(body)) {
    console.log("body is invalid");
    return buildResponseBody(400, "body is invalid");
  }

  const teamPair = decodeURI(pathParameters.teamPair);
  const date = pathParameters.date.replace(/\-/g, ".");

  const uuid = body.gameId;

  try {
    const { Item: onGoing } = await dynamoDb.get({
      TableName: ONGOING_GAMES_TABLE,
      Key: {
        uuid,
        date,
      },
    });

    if (!onGoing || (onGoing && onGoing.teamPairs.includes(teamPair))) {
      console.log("No on going game.");
      throw new Error("Bad request");
    }

    const [teamPairPlayers, { Item: person }, { Item: guesses }, _resp] =
      await Promise.all([
        getTeamPairData(teamPair, dynamoDb),
        dynamoDb.get({
          TableName: PERSON_TABLE,
          Key: {
            person: body.person,
          },
        }),
        dynamoDb.get({
          TableName: GUESSES_TABLE,
          Key: {
            teamPair,
            date,
          },
        }),
        dynamoDb.put({
          TableName: ONGOING_GAMES_TABLE,
          Item: {
            uuid,
            date,
            teamPairs: [...(onGoing.teamPairs ?? []), teamPair],
          },
        }),
      ]);

    if (!teamPairPlayers) {
      console.log("No players found for teamPair", teamPair);
      throw new Error("Internal server error");
    }

    const teamPairIncludesPerson = teamPairPlayers.players.some(
      (teamPairPlayer: { person: string }) =>
        teamPairPlayer.person === body.person
    );

    if (!person) {
      console.log("No person found. Person:", body.person);
      throw new Error("Internal server error");
    }

    const Item = {
      date,
      teamPair,
      guessedPlayers: {
        ...(guesses?.guessedPlayers ?? {}),
        [body.person]: {
          name: person.name,
          person: body.person,
          isCorrect: teamPairIncludesPerson,
          numOfGuesses:
            (guesses?.guessedPlayers[body.person]?.numOfGuesses || 0) + 1,
        },
      },
      totalGuesses: (guesses?.totalGuesses || 0) + 1,
    };

    await dynamoDb.put({
      TableName: GUESSES_TABLE,
      Item,
    });

    return buildResponseBody(200, JSON.stringify(Item));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
