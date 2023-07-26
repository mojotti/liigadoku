import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Stack, RemovalPolicy, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path from "path";
import { PlayerData } from "./player-data";
import { PlayersRestApi } from "./players-rest-api";

const getPlayerDataHandlerPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "handlers", "player-data", name].join("/");
};

export class LiigadokuStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const playerData = new PlayerData(this, "player-data", {
      account: this.account,
      region: this.region,
    });

    const restApi = new PlayersRestApi(this, "players-rest-api", {
      playersTable: playerData.playersTable,
      playerNamesTable: playerData.playerNamesTable,
      teamPairsTable: playerData.teamPairsTable,
      account: this.account,
      region: this.region,
    });
  }
}
