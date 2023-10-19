import TwitterApi from "twitter-api-v2";
import Twitter from "twitter-lite";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const client = new SSMClient({ region: "eu-north-1" });

const getSecret = (name: string): Promise<string> =>
  client
    .send(new GetParameterCommand({ Name: name, WithDecryption: true }))
    .then(({ Parameter }) => Parameter?.Value || "");

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
    console.log("doing request");
    const { media_id_string } = await clientUp.post("media/upload", {
      media: image?.toString("base64"),
    });

    console.log("media_id_string", media_id_string);

    const date = new Date();
    const sliced = date.toISOString().slice(0, 10);
    const finnishDate = sliced.split("-").reverse().join(".");

    await rwClient.v2.tweet({
      text: `Liigadoku.com ${finnishDate}`,
      media: { media_ids: [media_id_string] },
    });
    console.log("tweeted");
  } catch (e) {
    console.log(e);
  }
};
