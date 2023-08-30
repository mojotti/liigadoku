import fetch from "node-fetch";
import Ajv from "ajv";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Player, PlayerShortVersion, TeamPairPlayers } from "../../types";
import getUuid from "uuid-by-string";

const ajv = new Ajv();

const handleName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])\S/g, (match) => match.toUpperCase());
};

const teamsIn2000s = [
  "Kärpät",
  "HIFK",
  "Tappara",
  "Pelicans",
  "KalPa",
  "JYP",
  "TPS",
  "Ässät",
  "HPK",
  "Lukko",
  "SaiPa",
  "Sport",
  "KooKoo",
  "Ilves",
  "Jukurit",
  "Blues",
  "Jokerit",
];

export type PlayerSeason = {
  id: number;
  season: number;
  name: string;
  teamName: string;
  dateOfBirth: string;
  person: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;
  plusMinus: number;
  shots: number;
  endTime: string;
  nationalityCode: string;
};

const playerSeasonSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    season: { type: "integer" },
    name: { type: "string" },
    teamName: { type: "string" },
    dateOfBirth: { type: "string" },
    person: { type: "string" },
  },
  required: ["id", "season", "name", "teamName", "dateOfBirth", "person"],
  additionalProperties: true,
};

const validatePlayerSeason = ajv.compile(playerSeasonSchema);

const isPlayerSeason = (player: any): player is PlayerSeason => {
  return validatePlayerSeason(player);
};

export const fetchRunkosarjaPlayerIds = async (
  start: number,
  end: number
): Promise<string[]> => {
  const promises: Promise<any>[] = [];

  for (let year = start; year <= end; year++) {
    promises.push(
      fetch(`https://liiga.fi/api/v1/players/stats/${year}/runkosarja`),
      fetch(
        `https://liiga.fi/api/v1/players/info?season=${year}&tournament=runkosarja`
      )
    );
  }

  console.log(`Fetching data from ${start} to ${end}...`);
  const responses = await Promise.all(promises);
  const jsons = await Promise.all(responses.map((res) => res.json()));
  console.log(`Done fetching data from ${start} to ${end}`);

  return jsons
    .flatMap((json: any) => {
      if (!Array.isArray(json) || json.length === 0) {
        console.log("NOTHING TO PROCESS, continuing...");
        return undefined;
      }

      return json.map(({ fiha_id, id }) => {
        return fiha_id ?? id;
      });
    })
    .filter(Boolean);
};

export const fetchPreSeasonData = async (
  season: number
): Promise<PlayerSeason[]> => {
  console.log("Fetching pre-season data...");
  const games = await fetch(
    `https://liiga.fi/api/v1/players/info?tournament=valmistavat_ottelut&season=${season}`
  );
  const json: any = await games.json();

  console.log("Done fetching pre-season data");

  if (!Array.isArray(json) || json.length === 0) {
    console.log("NO PRE SEASON DATA");
  }

  return json
    .map((player: any) => {
      const { firstName, lastName, id, teamName, dateOfBirth } = player;
      const fullName = `${handleName(firstName)} ${handleName(lastName)}`;

      return {
        id,
        season: 2023,
        name: fullName,
        teamName,
        dateOfBirth,
        person: getUuid(`/api/v1/person/${id}/`),
      };
    })
    .filter(isPlayerSeason)
    .filter(Boolean);
};

export const putInBatches = async <T>(
  dynamoDb: DynamoDBDocument,
  table: string,
  insertables: T[]
) => {
  let index = 0;

  const maxBatchSize = 24;

  while (index < insertables.length) {
    const batch = insertables.slice(index, index + maxBatchSize);

    console.log(`Inserting batch: ${index} - ${index + maxBatchSize}`);

    try {
      await dynamoDb.batchWrite({
        RequestItems: {
          [table]: batch.map((batchItem) => ({
            PutRequest: {
              Item: batchItem as Record<string, any>,
            },
          })),
        },
      });
    } catch (e) {
      console.log("BATCH THAT FAILED: ", JSON.stringify(batch, null, 2));
      console.log("ERROR IN BATCH: ", e);
      throw e;
    }

    console.log(`Inserted batch: ${index} - ${index + maxBatchSize}`);

    index += maxBatchSize;
  }
};

const formatDateOfBirth = (dateOfBirth: string) => {
  const [year, month, day] = dateOfBirth.split("-");
  return `${day}.${month}.${year}`;
};

export const playerToShortVersion = (player: Player): PlayerShortVersion => {
  return {
    person: player.person,
    name: player.name,
    dateOfBirth: formatDateOfBirth(player.dateOfBirth),
  };
};

const formPairs = (arr: string[]): string[][] =>
  arr.map((v, i) => arr.slice(i + 1).map((w) => [v, w].sort())).flat();

export const getTeamsIn2000sPairs = () => formPairs(teamsIn2000s);
export const getTeamsIn2000s = () => teamsIn2000s;

export const fetchInBatches = async <T>(
  dynamoDb: DynamoDBDocument,
  table: string,
  insertables: T[]
) => {
  let index = 0;

  const maxBatchSize = 100;

  while (index < insertables.length) {
    const batch = insertables.slice(index, index + maxBatchSize);

    console.log(`Inserting batch: ${index} - ${index + maxBatchSize}`);
    try {
      await dynamoDb.batchWrite({
        RequestItems: {
          [table]: batch.map((batchPlayer) => ({
            PutRequest: {
              Item: batchPlayer as Record<string, any>,
            },
          })),
        },
      });
    } catch (e) {
      console.log("BATCH THAT FAILED: ", JSON.stringify(batch, null, 2));
      console.log("ERROR IN BATCH: ", e);
      throw e;
    }
    console.log(`Inserted batch: ${index} - ${index + maxBatchSize}`);

    index += maxBatchSize;
  }
};

const playerProfileSchema = {
  type: "object",
  properties: {
    fihaId: { type: "number" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    dateOfBirth: { type: "string" },
    nationality: {
      type: "object",
      properties: { code: { type: "string" }, name: { type: "string" } },
    },
    historical: {
      type: "object",
      properties: {
        regular: {
          type: "array",
          items: {
            type: "object",
            properties: {
              season: { type: "number" },
              games: { type: "number" },
              goals: { type: "number" },
              assists: { type: "number" },
              points: { type: "number" },
              penaltyMinutes: { type: "number" },
              plusMinus: { type: "number" },
              shots: { type: "number" },
              teamName: { type: "string" },
              endTime: { type: "string" },
            },
          },
        },
      },
    },
  },
  required: [
    "historical",
    "fihaId",
    "firstName",
    "lastName",
    "dateOfBirth",
    "nationality",
  ],
  additionalProperties: true,
};

const validatePlayerProfile = ajv.compile(playerProfileSchema);

type PlayerProfile = {
  fihaId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: {
    code: string;
    name: string;
  };
  historical: {
    regular: {
      season: number;
      games: number;
      goals: number;
      assists: number;
      points: number;
      penaltyMinutes: number;
      plusMinus: number;
      shots: number;
      teamName: string;
      endTime: string;
    }[];
  };
};

const isPlayerProfile = (player: any): player is PlayerProfile => {
  const isProfile = validatePlayerProfile(player);

  if (!isProfile) {
    console.log(JSON.stringify(player, null, 2));
  }

  return isProfile;
};

export const fetchPlayerProfileData = async (
  playerIds: string[]
): Promise<PlayerSeason[]> => {
  const playerData: PlayerSeason[] = [];

  let index = 0;

  const maxBatchSize = 99;

  while (index < playerIds.length) {
    const batch = playerIds.slice(index, index + maxBatchSize);

    console.log(`Fetching batch: ${index} - ${index + maxBatchSize}`);

    const promises = batch.map((id) =>
      fetch(`https://liiga.fi/api/v1/players/info/${id}`)
    );

    const responses = await Promise.all(promises);
    const jsons = await Promise.all(responses.map((res) => res.json()));
    const playerProfiles = jsons.filter(isPlayerProfile);

    playerProfiles.forEach(
      ({
        fihaId,
        firstName,
        dateOfBirth,
        lastName,
        historical,
        nationality,
      }) => {
        const name = `${handleName(firstName)} ${handleName(lastName)}`;
        const person = getUuid(`/api/v1/person/${fihaId}/`);

        historical.regular.forEach(
          ({
            season,
            teamName,
            games,
            goals,
            assists,
            points,
            penaltyMinutes,
            plusMinus,
            shots,
            endTime,
          }) => {
            playerData.push({
              person,
              name,
              season: season - 1,
              teamName,
              dateOfBirth,
              id: fihaId,
              games,
              goals,
              assists,
              points,
              penaltyMinutes,
              plusMinus,
              shots,
              endTime,
              nationalityCode: nationality.code,
            });
          }
        );
      }
    );

    console.log(`Fetched player batch: ${index} - ${index + maxBatchSize}`);

    index += maxBatchSize;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log({
    length: playerData.length,
    henrik: playerData.find((player) => player.name === "Henrik Juntunen"),
  });

  return playerData;
};
