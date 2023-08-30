import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PlayerData } from "./player-data";
import { PlayersRestApi } from "./players-rest-api";
import { Warmer } from "./vercel-warmer";

interface LiigadokuStackProps extends StackProps {
  readonly stageRef: string;
}

export class LiigadokuStack extends Stack {
  constructor(scope: Construct, id: string, props?: LiigadokuStackProps) {
    super(scope, id, props);

    if (!props) {
      throw new Error(
        `Initializing stack [ID: ${id}] failed. Missing stack props.`
      );
    }

    const playerData = new PlayerData(this, "player-data", {
      account: this.account,
      region: this.region,
      stageRef: props.stageRef,
    });

    const restApi = new PlayersRestApi(this, "players-rest-api", {
      playersTable: playerData.playersTable,
      playerNamesTable: playerData.playerNamesTable,
      teamPairsTable: playerData.teamPairsTable,
      milestoneTeamTable: playerData.milestoneTeamTable,
      account: this.account,
      region: this.region,
      personTable: playerData.personTable,
      stageRef: props.stageRef,
    });

    if (props.stageRef === "prod") {
      new Warmer(this, "vercel-warmer", {
        baseUrl: "https://liigadoku.com",
      });
    }
  }
}
