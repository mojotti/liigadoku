import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { GUESSES_TABLE, ONGOING_GAMES_TABLE } = process.env;

if (!GUESSES_TABLE) {
  throw new Error("PLAYER_NAMES_TABLE not defined");
}
if (!ONGOING_GAMES_TABLE) {
  throw new Error("ONGOING_GAMES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

const isValidBody: (body: any) => boolean = (body) => {
  if (!body.person || typeof body.person !== "string") {
    return false;
  }

  if (!body.name || typeof body.name !== "string") {
    return false;
  }

  if (body.isCorrect == null || typeof body.isCorrect !== "boolean") {
    return false;
  }

  if (!body.gameId || typeof body.gameId !== "string") {
    return false;
  }

  return true;
};

export const putGuess = async ({
  pathParameters,
  body: rawBody,
}: APIGatewayProxyEvent) => {
  const body = rawBody ? JSON.parse(rawBody) : undefined;

  if (!pathParameters?.teamPair) {
    return buildResponseBody(400, "teamPair is required");
  }

  if (!pathParameters?.date) {
    return buildResponseBody(400, "date is required");
  }

  if (!body) {
    return buildResponseBody(400, "body is required");
  }

  if (!isValidBody(body)) {
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
      throw new Error("Bad request");
    }

    await dynamoDb.put({
      TableName: ONGOING_GAMES_TABLE,
      Item: {
        uuid,
        date,
        teamPairs: [...onGoing.teamPairs ?? [], teamPair],
      },
    });

    const { Item: guesses } = await dynamoDb.get({
      TableName: GUESSES_TABLE,
      Key: {
        teamPair,
        date,
      },
    });

    const Item = {
      date,
      teamPair,
      guessedPlayers: {
        ...(guesses?.guessedPlayers ?? {}),
        [body.person]: {
          name: body.name,
          person: body.person,
          isCorrect: body.isCorrect,
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
