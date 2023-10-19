import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";
import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

const getLambdaPath = (): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "resources", "tweet-maker", "index.ts"].join("/");
};

export class DailyTweet extends Construct {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id);

    const warmupSchedule = new Rule(this, `tweet-schedule`, {
      schedule: Schedule.cron({
        minute: "0",
        hour: "5",
        month: "*",
        year: "*",
        weekDay: "*",
      }),
    });

    const lambda = new NodejsFunction(this, `tweet-maker`, {
      functionName: `tweet-maker`,
      runtime: Runtime.NODEJS_18_X,
      handler: "tweetLiigadoku",
      timeout: Duration.minutes(15),
      entry: getLambdaPath(),
      memorySize: 2048,
      initialPolicy: [
        new PolicyStatement({
          actions: ["ssm:*"],
          effect: Effect.ALLOW,
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["kms:Decrypt"],
          effect: Effect.ALLOW,
          resources: ["*"],
        }),
      ],
      bundling: {
        externalModules: [
          "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
        nodeModules: ["@sparticuz/chromium"],
      },
    });

    warmupSchedule.addTarget(
      new LambdaFunction(lambda, {
        event: RuleTargetInput.fromObject({ shouldUpdate: true }),
      })
    );
  }
}
