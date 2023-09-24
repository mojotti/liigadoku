import { APIGatewayProxyEventHeaders } from "aws-lambda";

export const buildResponseBody = (
  status: number,
  body: string,
  headers = {}
) => {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "application/json",
    },
    body,
  };
};

const url =
  "http://localhost:2773/systemsmanager/parameters/get?name=apiToken&withDecryption=true";

const getSecretValue = async () => {
  try {
    const raw = await fetch(url, {
      headers: {
        "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN!,
      },
    });

    return (await raw.json())?.Parameter?.Value;
  } catch (e) {
    console.log("Error", e);
    return buildResponseBody(500, JSON.stringify(e));
  }
};

export const authorize = async (headers: APIGatewayProxyEventHeaders) => {
  if (!headers.Authorization) {
    throw new Error("Unauthorized");
  }

  const secretValue = await getSecretValue();
  const token = headers.Authorization.split(" ")[1];

  if (token !== secretValue) {
    console.log("Unauthorized!!!");
    throw new Error("Forbidden");
  }
};
