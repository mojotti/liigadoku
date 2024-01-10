import { ScheduledHandler } from "aws-lambda";
import fetch from "node-fetch";

const { BASE_URL } = process.env;

export const handler: ScheduledHandler = async (_event): Promise<void> => {
  if (BASE_URL === undefined) {
    throw new Error("BASE_URL not defined");
  }
  const responses = await Promise.all([
    fetch(`${BASE_URL}`),
    fetch(`${BASE_URL}`),
    fetch(`${BASE_URL}`),
  ]);

  responses.map((response) =>
    console.log(`GET ${BASE_URL} ${response.status}`)
  );
};
