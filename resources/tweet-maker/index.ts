import TwitterApi from "twitter-api-v2";
import Twitter from "twitter-lite";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { formatInTimeZone } from "date-fns-tz";
import { LiigadokuOfTheDay } from "../../types";

const client = new SSMClient({ region: "eu-north-1" });

const getSecret = (name: string): Promise<string> =>
  client
    .send(new GetParameterCommand({ Name: name, WithDecryption: true }))
    .then(({ Parameter }) => Parameter?.Value || "");

const { LIIGADOKU_GAMES_TABLE } = process.env;

if (!LIIGADOKU_GAMES_TABLE) {
  throw new Error("LIIGADOKU_GAMES_TABLE not defined");
}

const dynamoDbClient = new DynamoDBClient({ region: "eu-north-1" });
const dynamoDb = DynamoDBDocument.from(dynamoDbClient);

const tz = "Europe/Helsinki";

const mapTeamNameToTweet = (teamName: string) => {
  switch (teamName) {
    case "TPS": {
      return "HCTPS";
    }
    case "Pelicans": {
      return "PelicansFI";
    }
    case "Sport": {
      return "VaasanSport";
    }
    case "Blues": {
      return "KiekkoEspoo";
    }
    default:
      return teamName;
  }
};

export const tweetLiigadoku = async () => {
  const twitterAppKey = await getSecret("twitterAppKey");
  const twitterAppSecret = await getSecret("twitterAppSecret");
  const twitterAccessToken = await getSecret("twitterAccessToken");
  const twitterAccessSecret = await getSecret("twitterAccessSecret");

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);
  await page.setViewport({ width: 1280, height: 1080 });
  await page.goto("https://liigadoku.com");
  await page.waitForSelector(".innerGridItem", { visible: true });

  const image = await (
    await page.waitForSelector(".gameGrid", { visible: true })
  )?.screenshot();

  await browser.close();

  const client = new TwitterApi({
    appKey: twitterAppKey,
    appSecret: twitterAppSecret,
    accessToken: twitterAccessToken,
    accessSecret: twitterAccessSecret,
  });

  const clientUp = new Twitter({
    consumer_key: twitterAppKey,
    consumer_secret: twitterAppSecret,
    access_token_key: twitterAccessToken,
    access_token_secret: twitterAccessSecret,
    subdomain: "upload",
  });

  const rwClient = client.readWrite;

  try {
    const helsinkiDate = formatInTimeZone(new Date(), tz, "dd.MM.yyyy");

    const { Item: liigadokuOfTheDay } = await dynamoDb.get({
      TableName: LIIGADOKU_GAMES_TABLE,
      Key: {
        date: helsinkiDate,
      },
    });

    const teams = liigadokuOfTheDay
      ? [
          ...(liigadokuOfTheDay as LiigadokuOfTheDay).xTeams.slice(0, 2),
          ...(liigadokuOfTheDay as LiigadokuOfTheDay).yTeams,
        ].flat()
      : [];

    console.log("doing request");
    const { media_id_string } = await clientUp.post("media/upload", {
      media: image?.toString("base64"),
    });

    console.log("media_id_string", media_id_string);

    const date = new Date();
    const sliced = date.toISOString().slice(0, 10);
    const finnishDate = sliced.split("-").reverse().join(".");

    const mappedTeams = teams.map(mapTeamNameToTweet);

    await rwClient.v2.tweet({
      text: `Liigadoku.com ${finnishDate}\n\nAskissa tänään: ${mappedTeams
        .slice(0, 4)
        .map((t) => `#${t}`)
        .join(", ")} ja #${mappedTeams[4]}\n\n#liigadoku`,
      media: { media_ids: [media_id_string] },
    });
    console.log("tweeted");
  } catch (e) {
    console.log(e);
  }
};
