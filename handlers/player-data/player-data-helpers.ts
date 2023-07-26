import fetch from "node-fetch";
import Ajv from "ajv";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Player, PlayerShortVersion, TeamPairPlayers } from "../../types";

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
          const returnable = {
            id,
            name,
            season,
            teamName,
            dateOfBirth,
            person,
          };

          if (returnable.name === "Eero Somervuori") {
            console.log({ returnable });
          }

          return returnable;
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
      const { firstName, lastName, id, ...rest } = player;
      const fullName = `${handleName(firstName)} ${handleName(lastName)}`;

      return {
        ...rest,
        name: fullName,
        id,
        season: 2023,
        person: `/api/v1/person/${id}/`,
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
    ({ person, dateOfBirth, teamName, name, season }) => {
      const hit = players[person];
      if (!hit) {
        players[person] = {
          person,
          dateOfBirth,
          teams: [teamName],
          name,
          seasons: { [teamName]: [season] },
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

export const playerToShortVersion = (player: Player): PlayerShortVersion => {
  return {
    person: player.person,
    name: player.name,
  };
};

const formPairs = (arr: string[]): string[][] =>
  arr.map((v, i) => arr.slice(i + 1).map((w) => [v, w].sort())).flat();

export const formPlayerTeamsData = (players: Player[]): TeamPairPlayers[] => {
  const teamsIn2000sPairs = formPairs(teamsIn2000s);
  const data: Record<string, PlayerShortVersion[]> = {};

  const teamPairs = teamsIn2000sPairs.map((pair) => pair.join("-"));

  players.forEach((player) => {
    const playerTeams = player.teams.sort().join("-");

    teamPairs.forEach((teamPair) => {
      if (playerTeams.includes(teamPair)) {
        data[teamPair] = [
          ...(data[teamPair] || []),
          {
            person: player.person,
            name: player.name,
          },
        ];
      }
    });
  });

  return Object.entries(data).map(([teamPair, players]) => ({
    teamPair,
    players,
  }));
};
