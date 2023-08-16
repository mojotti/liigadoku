import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { get } from "http";
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

    const liigadokuGamesTable = new Table(this, "liigadoku-games", {
      tableName: "liigadoku-games",
      partitionKey: { name: "date", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GET /liigadoku-of-the-day
    const fetchCurrentLiigadokuGame = new NodejsFunction(
      this,
      "rest-liigadoku-of-the-day",
      {
        functionName: "rest-liigadoku-of-the-day",
        handler: "getLiigadokuOfTheDay",
        entry: getLambdaPath("liigadoku-of-the-day.ts"),
        ...defaultLambdaOpts,
        environment: {
          LIIGADOKU_GAMES_TABLE: liigadokuGamesTable.tableName,
        },
      }
    );

    const onGoingGamesTable = new Table(this, "on-going-games", {
      tableName: "on-going-games",
      partitionKey: { name: "date", type: AttributeType.STRING },
      sortKey: { name: "uuid", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const guessesTable = new Table(this, "guesses", {
      tableName: "guesses",
      partitionKey: { name: "date", type: AttributeType.STRING },
      sortKey: { name: "teamPair", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // PUT /guesses/by-date-and-team-pair/:date/:teamPair
    const putGuessLambda = new NodejsFunction(this, "rest-put-guess", {
      functionName: "rest-put-guess",
      handler: "putGuess",
      entry: getLambdaPath("put-guesses.ts"),
      ...defaultLambdaOpts,
      environment: {
        GUESSES_TABLE: guessesTable.tableName,
        ONGOING_GAMES_TABLE: onGoingGamesTable.tableName,
      },
    });

    // GET /guesses/by-date-and-team-pair/:date/:teamPair
    const getGuessesLambda = new NodejsFunction(
      this,
      "rest-get-guesses-by-date-and-team-pair",
      {
        functionName: "rest-get-guesses-by-date-and-team-pair",
        handler: "getGuessesByDateAndTeamPair",
        entry: getLambdaPath("get-guesses.ts"),
        ...defaultLambdaOpts,
        environment: {
          GUESSES_TABLE: guessesTable.tableName,
        },
      }
    );

    // GET /games/new/:date
    const getNewGameLambda = new NodejsFunction(this, "rest-get-new-game", {
      functionName: "rest-get-new-game",
      handler: "getNewGame",
      entry: getLambdaPath("get-new-game.ts"),
      ...defaultLambdaOpts,
      environment: {
        ONGOING_GAMES_TABLE: onGoingGamesTable.tableName,
      },
    });

    onGoingGamesTable.grantReadWriteData(getNewGameLambda);
    onGoingGamesTable.grantReadWriteData(putGuessLambda);

    guessesTable.grantReadWriteData(putGuessLambda);
    guessesTable.grantReadData(getGuessesLambda);

    liigadokuGamesTable.grantReadWriteData(fetchCurrentLiigadokuGame);

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

    const guesses = api.root.addResource("guesses");

    const guessByDateAndTeamPair = guesses
      .addResource("by-date-and-team-pair")
      .addResource("{date}")
      .addResource("{teamPair}");

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

    liigadokuOfTheDay.addMethod("GET", getLiigadokuOfTheDayIntegration); // GET /liigadoku-of-the-day

    guessByDateAndTeamPair.addMethod("PUT", putGuessIntegration); // PUT /guesses/by-date-and-team-pair/:date/:teamPair
    guessByDateAndTeamPair.addMethod("GET", getGuessesIntegration); // GET /guesses/by-date-and-team-pair/:date/:teamPair

    newGame.addMethod("GET", getNewGameIntegration); // GET /games/new/:date
  }
}
