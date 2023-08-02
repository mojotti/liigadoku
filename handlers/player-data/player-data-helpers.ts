import fetch from "node-fetch";
import Ajv from "ajv";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Player, PlayerShortVersion, TeamPairPlayers } from "../../types";
import getUuid from "uuid-by-string";

const ajv = new Ajv();

const handleName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
};

/*
+------------------------+
| teams on 2000s         |
+------------------------+
| Kärpät                 |
| HIFK                   |
| Tappara                |
| Pelicans               |
| KalPa                  |
| JYP                    |
| TPS                    |
| Ässät                  |
| HPK                    |
| Lukko                  |
| SaiPa                  |
| Sport                  |
| KooKoo                 |
| Ilves                  |
| Jukurit                |
| Blues                  |
| Jokerit                |
+------------------------+
 */

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

type PlayerSeason = {
  id: number;
  season: number;
  name: string;
  teamName: string;
  dateOfBirth: string;
  person: string;
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
  additionalProperties: false,
};

const validatePlayerSeason = ajv.compile(playerSeasonSchema);

const isPlayerSeason = (player: any): player is PlayerSeason => {
  return validatePlayerSeason(player);
};

export const fetchSeasonData = async (start: number, end: number) => {
  const promises: Promise<any>[] = [];

  for (let year = start; year <= end; year++) {
    promises.push(
      fetch(`https://liiga.fi/api/v1/players/stats/${year}/runkosarja`)
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

      return json.map(
        ({
          fiha_id: id,
          season,
          full_name: name,
          team: teamName,
          date_of_birth: dateOfBirth,
          person,
        }) => {
          return {
            id,
            name,
            season,
            teamName,
            dateOfBirth,
            person: getUuid(person),
          };
        }
      );
    })
    .filter(isPlayerSeason)
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

export const groupPlayers = (
  playersBySeasons: PlayerSeason[]
): Record<string, Player> => {
  const players: Record<string, Player> = {};

  playersBySeasons.forEach(
    ({ person, dateOfBirth, teamName, name, season, id }) => {
      const hit = players[person];
      if (!hit) {
        players[person] = {
          person,
          dateOfBirth,
          teams: [teamName],
          name,
          seasons: { [teamName]: [season] },
          id,
        };
        return;
      }

      if (!hit.teams.includes(teamName)) {
        players[person] = {
          person,
          dateOfBirth,
          teams: [...hit.teams, teamName],
          seasons: { ...hit.seasons, [teamName]: [season] },
          name,
          id,
        };
      } else {
        players[person] = {
          person,
          dateOfBirth,
          teams: hit.teams,
          seasons: {
            ...hit.seasons,
            [teamName]: [...hit.seasons[teamName], season],
          },
          name,
          id,
        };
      }
    }
  );

  return players;
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
    await dynamoDb.batchWrite({
      RequestItems: {
        [table]: batch.map((batchPlayer) => ({
          PutRequest: {
            Item: batchPlayer as Record<string, any>,
          },
        })),
      },
    });
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

export const formPlayerTeamsData = (players: Player[]): TeamPairPlayers[] => {
  const playersByTeam: Record<string, PlayerShortVersion[]> = {};

  players.forEach((player) => {
    player.teams.forEach((team) => {
      playersByTeam[team] = [
        ...(playersByTeam[team] || []),
        playerToShortVersion(player),
      ];
    });
  });

  const teamsIn2000sPairs = getTeamsIn2000sPairs();
  const data: Record<string, PlayerShortVersion[]> = {};

  teamsIn2000sPairs.forEach(([team1, team2]) => {
    const playersInTeam1 = playersByTeam[team1] || [];
    const playersInTeam2 = playersByTeam[team2] || [];

    const playersInBothTeams = playersInTeam1.filter((player) =>
      playersInTeam2.some((p) => p.person === player.person)
    );

    data[`${team1}-${team2}`] = playersInBothTeams;
  });

  return Object.entries(data).map(([teamPair, players]) => ({
    teamPair,
    players: players.map((p) => ({ person: p.person })),
  }));
};

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
    await dynamoDb.batchWrite({
      RequestItems: {
        [table]: batch.map((batchPlayer) => ({
          PutRequest: {
            Item: batchPlayer as Record<string, any>,
          },
        })),
      },
    });
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
    historical: {
      type: "object",
      properties: {
        regular: {
          type: "array",
          items: {
            type: "object",
            properties: {
              season: { type: "number" },
              teamName: { type: "string" },
            },
          },
        },
      },
    },
  },
  required: ["historical", "fihaId", "firstName", "lastName", "dateOfBirth"],
  additionalProperties: true,
};

const validatePlayerProfile = ajv.compile(playerProfileSchema);

type PlayerProfile = {
  fihaId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  historical: {
    regular: {
      season: number;
      teamName: string;
    }[];
  };
};

const isPlayerProfile = (player: any): player is PlayerProfile => {
  return validatePlayerProfile(player);
};

export const fetchPlayerProfileData = async (players: PlayerSeason[]) => {
  const playerData: PlayerSeason[] = [];

  let index = 0;

  const maxBatchSize = 99;

  const playersWithID = players.filter((player) => Boolean(player.id));

  while (index < playersWithID.length) {
    const batch = playersWithID.slice(index, index + maxBatchSize);

    console.log(`Inserting batch: ${index} - ${index + maxBatchSize}`);

    const promises = batch.map(({ id }) =>
      fetch(`https://liiga.fi/api/v1/players/info/${id}`)
    );

    const responses = await Promise.all(promises);
    const jsons = await Promise.all(responses.map((res) => res.json()));
    const playerProfiles = jsons.filter(isPlayerProfile);

    playerProfiles.forEach(
      ({ fihaId, firstName, dateOfBirth, lastName, historical }) => {
        const name = `${handleName(firstName)} ${handleName(lastName)}`;
        const person = getUuid(`/api/v1/person/${fihaId}/`);

        historical.regular.forEach(({ season, teamName }) => {
          playerData.push({
            person,
            name,
            season: season - 1,
            teamName,
            dateOfBirth,
            id: fihaId,
          });
        });
      }
    );

    console.log(`Fetched player batch: ${index} - ${index + maxBatchSize}`);

    index += maxBatchSize;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log({
    length: playerData.length,
    eero: playerData.find((player) => player.name === "Eero Somervuori"),
  });

  return playerData;
};
