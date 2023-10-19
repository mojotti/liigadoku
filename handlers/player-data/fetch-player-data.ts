import {
  fetchPlayerProfileData,
  fetchRunkosarjaPlayerIds,
} from "./player-data-helpers";
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

const { PROFILE_BUCKET } = process.env;

if (!PROFILE_BUCKET) {
  throw new Error("PROFILE_BUCKET not defined");
}

const s3client = new S3Client({ region: "eu-north-1" });

const PLAYER_DATA = "player-profiles.json";

export const handler = async (_event: any) => {
  try {
    const playerIds = await fetchRunkosarjaPlayerIds(1975, 2024);
    const profiles = await fetchPlayerProfileData([...new Set(playerIds)]);

    const input: PutObjectCommandInput = {
      Bucket: PROFILE_BUCKET,
      Key: PLAYER_DATA,
      Body: JSON.stringify(profiles),
      ContentType: "application/json",
    };
    const putCommand = new PutObjectCommand(input);
    const response = await s3client.send(putCommand);
    console.log({ response });

    console.log("Done!");
  } catch (e) {
    console.log("Error", e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
  return {
    statusCode: 200,
    body: "ok",
  };
};
