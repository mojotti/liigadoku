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

const getPlayerDataHandlerPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "handlers", "player-data", name].join("/");
};

type Props = {
  region: string;
  account: string;
};

export class PlayerData extends Construct {
  public readonly playersTable: Table;
  public readonly playerNamesTable: Table;
  public readonly teamPairsTable: Table;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { region, account } = props;

    const playersTable = new Table(this, "players", {
      tableName: "players",
      partitionKey: { name: "name", type: AttributeType.STRING },
      sortKey: { name: "person", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const playerNamesTable = new Table(this, "players-names", {
      tableName: "player-names",
      partitionKey: { name: "all", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const teamPairsTable = new Table(this, "team-pairs-with-players", {
      tableName: "team-pairs-with-players",
      partitionKey: { name: "teamPair", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const fetchPlayerDataOpts: Partial<NodejsFunctionProps> = {
      bundling: { minify: true, sourceMap: true },
      timeout: Duration.seconds(90),
      memorySize: 512,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["lambda:invokeFunction"],
          resources: [
            `arn:aws:lambda:${region}:${account}:function:fetch-player-data`,
          ],
        }),
        new PolicyStatement({
          actions: ["logs:*"],
          effect: Effect.ALLOW,
          resources: [`arn:aws:logs:${region}:${account}:*`],
        }),
      ],
      runtime: Runtime.NODEJS_16_X,
      environment: {
        PLAYERS_TABLE: playersTable.tableName,
        PLAYER_NAMES_TABLE: playerNamesTable.tableName,
        TEAM_PAIRS_TABLE: teamPairsTable.tableName,
      },
    };

    const fetchPlayerDataLambda = new NodejsFunction(
      this,
      "fetch-player-data-lambda",
      {
        functionName: "fetch-player-data",
        handler: "handler",
        entry: getPlayerDataHandlerPath("fetch-player-data.ts"),
        ...fetchPlayerDataOpts,
      }
    );

    playersTable.grantReadWriteData(fetchPlayerDataLambda);
    playerNamesTable.grantReadWriteData(fetchPlayerDataLambda);
    teamPairsTable.grantReadWriteData(fetchPlayerDataLambda);

    this.playersTable = playersTable;
    this.playerNamesTable = playerNamesTable;
    this.teamPairsTable = teamPairsTable;
  }
}
