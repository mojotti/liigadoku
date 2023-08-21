import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { buildResponseBody } from "./helpers";
import { APIGatewayProxyEvent } from "aws-lambda";

const { GUESSES_TABLE } = process.env;

if (!GUESSES_TABLE) {
  throw new Error("GUESSES_TABLE not defined");
}

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(client);

export const getGuessesByDate = async ({
  pathParameters,
}: APIGatewayProxyEvent) => {
  if (!pathParameters?.date) {
    return buildResponseBody(400, "date is required");
  }

  const date = pathParameters.date.replace(/\-/g, ".");

  try {
    const { Items: guesses } = await dynamoDb.query({
      TableName: GUESSES_TABLE,
      KeyConditionExpression: "#date = :date",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":date": date,
      },
    });

    return buildResponseBody(200, JSON.stringify(guesses));
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};
