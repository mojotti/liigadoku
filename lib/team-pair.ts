import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { TeamPairPlayers } from "../types";
import { milestoneKeys } from "./utils";

const { MILESTONE_TEAMS_TABLE, TEAM_PAIRS_TABLE } = process.env;

if (!MILESTONE_TEAMS_TABLE) {
  throw new Error("MILESTONE_TEAMS_TABLE not defined");
}
if (!TEAM_PAIRS_TABLE) {
  throw new Error("TEAM_PAIRS_TABLE not defined");
}

export const getTeamPairData = async (
  teamPair: string,
  dynamoDb: DynamoDBDocument
) => {
  const [team1, team2] = teamPair.split("-");

  console.log({ team1, team2, teamPair });

  try {
    if (milestoneKeys.includes(team1) || milestoneKeys.includes(team2)) {
      const players = await dynamoDb.get({
        TableName: MILESTONE_TEAMS_TABLE,
        Key: {
          teamPair,
        },
      });

      console.log("milestone players:" + JSON.stringify(players.Item));

      return players.Item as TeamPairPlayers;
    }

    const players = await dynamoDb.get({
      TableName: TEAM_PAIRS_TABLE,
      Key: {
        teamPair,
      },
    });

    return players.Item as TeamPairPlayers;
  } catch (e) {
    console.log("Error", e);
    throw new Error("Internal server error");
  }
};

export const isValidTeamPair = (teamPair?: TeamPairPlayers): boolean => {
  console.log("Checking Team Pair validity", JSON.stringify(teamPair, null, 2));
  if (!teamPair) {
    return false;
  }

  return teamPair.players.length >= 5;
};
