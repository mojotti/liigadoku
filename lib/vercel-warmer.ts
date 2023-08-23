import { StackProps, Tags, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";
import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export interface Props extends StackProps {
  readonly baseUrl: string;
}

const getLambdaPath = (name: string): string => {
  const base = path.resolve(__dirname) + "/..";
  return [base, "resources", name].join("/");
};

export class Warmer extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { baseUrl } = props;

    const warmupSchedule = new Rule(this, `vercel-warmup-schedule`, {
      schedule: Schedule.cron({
        minute: "0/5",
        hour: "2-22",
        month: "*",
        year: "*",
        weekDay: "*",
      }),
    });

    const lambda = new NodejsFunction(this, `vercel-warmer`, {
      functionName: `vercel-warmer`,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      memorySize: 512,
      timeout: Duration.seconds(30),
      entry: getLambdaPath("vercel-warmer.ts"),
      environment: {
        BASE_URL: baseUrl,
      },
    });

    warmupSchedule.addTarget(
      new LambdaFunction(lambda, {
        event: RuleTargetInput.fromObject({ shouldUpdate: true }),
      })
    );
  }
}
