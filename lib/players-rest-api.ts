import { Duration } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "path";

type Props = {
  playersTable: Table;
  playerNamesTable: Table;
  teamPairsTable: Table;
  region: string;
  account: string;
};

const getLambdaPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "resources", name].join("/");
};

export class PlayersRestApi extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { playersTable, playerNamesTable, teamPairsTable, region, account } =
      props;

    const defaultLambdaOpts: Partial<NodejsFunctionProps> = {
      bundling: { minify: true, sourceMap: true },
      timeout: Duration.seconds(10),
      memorySize: 512,
      initialPolicy: [
        new PolicyStatement({
          actions: ["logs:*"],
          effect: Effect.ALLOW,
          resources: [`arn:aws:logs:${region}:${account}:*`],
        }),
      ],
      runtime: Runtime.NODEJS_16_X,
    };

    // GET /players/all
    const fetchAllPlayersLambda = new NodejsFunction(this, "rest-all-players", {
      functionName: "rest-all-players",
      handler: "getAllPlayers",
      entry: getLambdaPath("all-players.ts"),
      ...defaultLambdaOpts,
      environment: {
        PLAYER_NAMES_TABLE: playerNamesTable.tableName,
      },
    });
    playerNamesTable.grantReadData(fetchAllPlayersLambda);

    // GET /players/team-pairs/:teamPair
    const fetchTeamPairPlayers = new NodejsFunction(
      this,
      "rest-team-pair-players",
      {
        functionName: "rest-team-pair-players",
        handler: "getTeamPairPlayers",
        entry: getLambdaPath("team-pair-players.ts"),
        ...defaultLambdaOpts,
        environment: {
          TEAM_PAIRS_TABLE: teamPairsTable.tableName,
        },
      }
    );

    teamPairsTable.grantReadData(fetchTeamPairPlayers);

    const api = new RestApi(this, "players-rest-api", {
      restApiName: "Players Service",
      description: "This service serves players and team data.",
    });

    const getAllPlayersIntegration = new LambdaIntegration(
      fetchAllPlayersLambda,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const getTeamPairsIntegration = new LambdaIntegration(
      fetchTeamPairPlayers,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const players = api.root.addResource("players");
    const allPlayers = players.addResource("all");
    const teamPairs = players.addResource("team-pairs");
    const teamPairPlayers = teamPairs.addResource("{teamPair}");

    players.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    allPlayers.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });

    allPlayers.addMethod("GET", getAllPlayersIntegration); // GET /players/all
    teamPairPlayers.addMethod("GET", getTeamPairsIntegration); // GET /players/team-pairs/:teamPair
  }
}
