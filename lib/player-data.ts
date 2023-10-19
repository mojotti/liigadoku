import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path from "path";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { getName } from "./utils";

const getPlayerDataHandlerPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "handlers", "player-data", name].join("/");
};

type Props = {
  region: string;
  account: string;
  stageRef: string;
};

export class PlayerData extends Construct {
  public readonly playersTable: Table;
  public readonly playerNamesTable: Table;
  public readonly teamPairsTable: Table;
  public readonly milestoneTeamTable: Table;
  public readonly personTable: Table;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { region, account, stageRef } = props;

    const playersTable = new Table(this, getName(stageRef, "players"), {
      tableName: getName(stageRef, "players"),
      partitionKey: { name: "name", type: AttributeType.STRING },
      sortKey: { name: "person", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: false,
    });

    const profileBucket = new Bucket(scope, getName(stageRef, "profile-data"), {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      bucketName: getName(stageRef, "liigadoku-player-profiles"),
    });

    const playerNamesTable = new Table(
      this,
      getName(stageRef, "player-names"),
      {
        tableName: getName(stageRef, "player-names"),
        partitionKey: { name: "all", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        pointInTimeRecovery: true,
      }
    );

    const teamPairsTable = new Table(
      this,
      getName(stageRef, "team-pairs-with-players"),
      {
        tableName: getName(stageRef, "team-pairs-with-players"),
        partitionKey: { name: "teamPair", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        pointInTimeRecovery: true,
      }
    );

    const milestoneTeamTable = new Table(
      this,
      getName(stageRef, "milestone-teams-with-players"),
      {
        tableName: getName(stageRef, "milestone-teams-with-players"),
        partitionKey: { name: "teamPair", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        pointInTimeRecovery: true,
      }
    );

    const personTable = new Table(this, getName(stageRef, "person"), {
      tableName: getName(stageRef, "person"),
      partitionKey: { name: "person", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const fetchPlayerDataOpts: Partial<NodejsFunctionProps> = {
      bundling: { minify: true, sourceMap: true },
      timeout: Duration.minutes(15),
      memorySize: 1024,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["lambda:invokeFunction"],
          resources: [
            `arn:aws:lambda:${region}:${account}:function:${getName(
              stageRef,
              "fetch-player-data"
            )}`,
          ],
        }),
        new PolicyStatement({
          actions: ["logs:*"],
          effect: Effect.ALLOW,
          resources: [`arn:aws:logs:${region}:${account}:*`],
        }),
      ],
      runtime: Runtime.NODEJS_18_X,
      environment: {
        PROFILE_BUCKET: profileBucket.bucketName,
      },
    };

    const fetchPlayerDataLambda = new NodejsFunction(
      this,
      getName(stageRef, "fetch-player-data-lambda"),
      {
        functionName: getName(stageRef, "fetch-player-data"),
        handler: "handler",
        entry: getPlayerDataHandlerPath("fetch-player-data.ts"),
        ...fetchPlayerDataOpts,
      }
    );


    const updatePlayerDataOpts: Partial<NodejsFunctionProps> = {
      bundling: { minify: true, sourceMap: true },
      timeout: Duration.minutes(15),
      memorySize: 1024,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["lambda:invokeFunction"],
          resources: [
            `arn:aws:lambda:${region}:${account}:function:${getName(
              stageRef,
              "update-data-from-s3"
            )}`,
          ],
        }),
        new PolicyStatement({
          actions: ["logs:*"],
          effect: Effect.ALLOW,
          resources: [`arn:aws:logs:${region}:${account}:*`],
        }),
      ],
      runtime: Runtime.NODEJS_18_X,
      environment: {
        PLAYERS_TABLE: playersTable.tableName,
        PLAYER_NAMES_TABLE: playerNamesTable.tableName,
        TEAM_PAIRS_TABLE: teamPairsTable.tableName,
        MILESTONE_TEAM_TABLE: milestoneTeamTable.tableName,
        PROFILE_BUCKET: profileBucket.bucketName,
        PERSON_TABLE: personTable.tableName,
      },
    };

    const updatePlayerDataLambda = new NodejsFunction(
      this,
      getName(stageRef, "update-data-from-s3"),
      {
        functionName: getName(stageRef, "update-data-from-s3"),
        handler: "handler",
        entry: getPlayerDataHandlerPath("update-data-from-s3.ts"),
        ...updatePlayerDataOpts,
      }
    );

    playersTable.grantWriteData(updatePlayerDataLambda);
    playerNamesTable.grantWriteData(updatePlayerDataLambda);
    teamPairsTable.grantWriteData(updatePlayerDataLambda);
    milestoneTeamTable.grantWriteData(updatePlayerDataLambda);
    personTable.grantWriteData(updatePlayerDataLambda);

    profileBucket.grantWrite(fetchPlayerDataLambda);
    profileBucket.grantRead(updatePlayerDataLambda);

    this.playersTable = playersTable;
    this.playerNamesTable = playerNamesTable;
    this.teamPairsTable = teamPairsTable;
    this.personTable = personTable;
    this.milestoneTeamTable = milestoneTeamTable;
  }
}
