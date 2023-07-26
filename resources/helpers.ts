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
