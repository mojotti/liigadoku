import { Duration, RemovalPolicy, SecretValue } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "path";
import { getName } from "./utils";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

type Props = {
  playersTable: Table;
  playerNamesTable: Table;
  personTable: Table;
  teamPairsTable: Table;
  milestoneTeamTable: Table;
  region: string;
  account: string;
  stageRef: string;
};

const getLambdaPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "resources", name].join("/");
};

export class PlayersRestApi extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const {
      milestoneTeamTable,
      personTable,
      playerNamesTable,
      teamPairsTable,
      region,
      account,
      stageRef,
    } = props;

    const layerVersionArn =
      "arn:aws:lambda:eu-north-1:427196147048:layer:AWS-Parameters-and-Secrets-Lambda-Extension:11";

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
        new PolicyStatement({
          actions: ["ssm:GetParameter"],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["kms:Decrypt"],
          resources: ["*"],
        }),
      ],
      runtime: Runtime.NODEJS_18_X,
      layers: [
        LayerVersion.fromLayerVersionArn(this, "Layer", layerVersionArn),
      ],
      environment: {},
    };

    // GET /players/all
    const fetchAllPlayersLambda = new NodejsFunction(
      this,
      getName(stageRef, "rest-all-players"),
      {
        functionName: getName(stageRef, "rest-all-players"),
        handler: "getAllPlayers",
        entry: getLambdaPath("all-players.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          PLAYER_NAMES_TABLE: playerNamesTable.tableName,
        },
      }
    );
    playerNamesTable.grantReadData(fetchAllPlayersLambda);

    // GET /players/team-pairs/:teamPair
    const fetchTeamPairPlayers = new NodejsFunction(
      this,
      getName(stageRef, "rest-team-pair-players"),
      {
        functionName: getName(stageRef, "rest-team-pair-players"),
        handler: "getTeamPairPlayers",
        entry: getLambdaPath("team-pair-players.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          TEAM_PAIRS_TABLE: teamPairsTable.tableName,
          MILESTONE_TEAMS_TABLE: milestoneTeamTable.tableName,
        },
      }
    );

    const liigadokuGamesTable = new Table(
      this,
      getName(stageRef, "liigadoku-games"),
      {
        tableName: getName(stageRef, "liigadoku-games"),
        partitionKey: { name: "date", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        pointInTimeRecovery: true,
      }
    );

    // GET /liigadoku-of-the-day
    const fetchCurrentLiigadokuGame = new NodejsFunction(
      this,
      getName(stageRef, "rest-liigadoku-of-the-day"),
      {
        functionName: getName(stageRef, "rest-liigadoku-of-the-day"),
        handler: "getLiigadokuOfTheDay",
        entry: getLambdaPath("liigadoku-of-the-day.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          LIIGADOKU_GAMES_TABLE: liigadokuGamesTable.tableName,
          MILESTONE_TEAMS_TABLE: milestoneTeamTable.tableName,
          TEAM_PAIRS_TABLE: teamPairsTable.tableName,
        },
      }
    );

    // GET /players/team-pairs/by-date/:date
    const fetchTeamPairPlayersByDate = new NodejsFunction(
      this,
      getName(stageRef, "rest-team-pair-players-by-date"),
      {
        functionName: getName(stageRef, "rest-team-pair-players-by-date"),
        handler: "getTeamPairPlayersByDate",
        entry: getLambdaPath("team-pair-players-by-date.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          TEAM_PAIRS_TABLE: teamPairsTable.tableName,
          MILESTONE_TEAMS_TABLE: milestoneTeamTable.tableName,
          LIIGADOKU_GAMES_TABLE: liigadokuGamesTable.tableName,
        },
      }
    );

    const onGoingGamesTable = new Table(
      this,
      getName(stageRef, "on-going-games"),
      {
        tableName: getName(stageRef, "on-going-games"),
        partitionKey: { name: "date", type: AttributeType.STRING },
        sortKey: { name: "uuid", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        pointInTimeRecovery: true,
      }
    );

    const guessesTable = new Table(this, getName(stageRef, "guesses"), {
      tableName: getName(stageRef, "guesses"),
      partitionKey: { name: "date", type: AttributeType.STRING },
      sortKey: { name: "teamPair", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // PUT /guesses/by-date-and-team-pair/:date/:teamPair
    const putGuessLambda = new NodejsFunction(
      this,
      getName(stageRef, "rest-put-guess"),
      {
        functionName: getName(stageRef, "rest-put-guess"),
        handler: "putGuess",
        entry: getLambdaPath("put-guesses.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          GUESSES_TABLE: guessesTable.tableName,
          ONGOING_GAMES_TABLE: onGoingGamesTable.tableName,
          TEAM_PAIRS_TABLE: teamPairsTable.tableName,
          PERSON_TABLE: personTable.tableName,
          MILESTONE_TEAMS_TABLE: milestoneTeamTable.tableName,
        },
      }
    );

    // GET /guesses/by-date-and-team-pair/:date/:teamPair
    const getGuessesLambda = new NodejsFunction(
      this,
      getName(stageRef, "rest-get-guesses-by-date"),
      {
        functionName: getName(stageRef, "rest-get-guesses-by-date"),
        handler: "getGuessesByDate",
        entry: getLambdaPath("get-guesses.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          GUESSES_TABLE: guessesTable.tableName,
        },
      }
    );

    // GET /games/new/:date
    const getNewGameLambda = new NodejsFunction(
      this,
      getName(stageRef, "rest-get-new-game"),
      {
        functionName: getName(stageRef, "rest-get-new-game"),
        handler: "getNewGame",
        entry: getLambdaPath("get-new-game.ts"),
        ...defaultLambdaOpts,
        environment: {
          ...defaultLambdaOpts.environment,
          ONGOING_GAMES_TABLE: onGoingGamesTable.tableName,
        },
      }
    );

    onGoingGamesTable.grantReadWriteData(getNewGameLambda);
    onGoingGamesTable.grantReadWriteData(putGuessLambda);

    guessesTable.grantReadWriteData(putGuessLambda);
    guessesTable.grantReadData(getGuessesLambda);

    liigadokuGamesTable.grantReadWriteData(fetchCurrentLiigadokuGame);
    liigadokuGamesTable.grantReadData(fetchTeamPairPlayersByDate);

    teamPairsTable.grantReadData(fetchTeamPairPlayers);
    teamPairsTable.grantReadData(putGuessLambda);
    teamPairsTable.grantReadData(fetchTeamPairPlayersByDate);
    teamPairsTable.grantReadData(fetchCurrentLiigadokuGame);

    milestoneTeamTable.grantReadData(fetchTeamPairPlayers);
    milestoneTeamTable.grantReadData(putGuessLambda);
    milestoneTeamTable.grantReadData(fetchTeamPairPlayersByDate);
    milestoneTeamTable.grantReadData(fetchCurrentLiigadokuGame);

    personTable.grantReadData(putGuessLambda);

    const api = new RestApi(this, getName(stageRef, "players-rest-api"), {
      restApiName: `Players Service (${stageRef})`,
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

    const getTeamPairsByDateIntegration = new LambdaIntegration(
      fetchTeamPairPlayersByDate,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const getLiigadokuOfTheDayIntegration = new LambdaIntegration(
      fetchCurrentLiigadokuGame,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const putGuessIntegration = new LambdaIntegration(putGuessLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    const getGuessesIntegration = new LambdaIntegration(getGuessesLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    const getNewGameIntegration = new LambdaIntegration(getNewGameLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    const players = api.root.addResource("players");
    const liigadokuOfTheDay = api.root.addResource("liigadoku-of-the-day");
    const newGame = api.root
      .addResource("games")
      .addResource("new")
      .addResource("{date}");

    const allPlayers = players.addResource("all");
    const teamPairs = players.addResource("team-pairs");

    const teamPairPlayers = teamPairs.addResource("{teamPair}");
    const teamPairPlayersByDate = teamPairs
      .addResource("by-date")
      .addResource("{date}");

    const guesses = api.root.addResource("guesses");

    const guessByDateAndTeamPair = guesses
      .addResource("by-date-and-team-pair")
      .addResource("{date}")
      .addResource("{teamPair}");

    const guessByDate = guesses.addResource("by-date").addResource("{date}");

    players.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    allPlayers.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    liigadokuOfTheDay.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    guessByDate.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    guessByDateAndTeamPair.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });
    newGame.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PUT", "PATCH"],
    });

    allPlayers.addMethod("GET", getAllPlayersIntegration); // GET /players/all

    teamPairPlayers.addMethod("GET", getTeamPairsIntegration); // GET /players/team-pairs/:teamPair
    teamPairPlayersByDate.addMethod("GET", getTeamPairsByDateIntegration); // GET /players/team-pairs/by-date/:date

    liigadokuOfTheDay.addMethod("GET", getLiigadokuOfTheDayIntegration); // GET /liigadoku-of-the-day

    guessByDateAndTeamPair.addMethod("PUT", putGuessIntegration); // PUT /guesses/by-date-and-team-pair/:date/:teamPair
    guessByDate.addMethod("GET", getGuessesIntegration); // GET /guesses/by-date/:date

    newGame.addMethod("GET", getNewGameIntegration); // GET /games/new/:date
  }
}
