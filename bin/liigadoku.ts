#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LiigadokuStack } from "../lib/liigadoku-stack";

const app = new cdk.App();

new LiigadokuStack(app, "LiigadokuStack", {
  env: { account: "416742179831", region: "eu-north-1" },
  stageRef: "prod",
});

new LiigadokuStack(app, "LiigadokuStack-dev", {
  env: { account: "416742179831", region: "eu-north-1" },
  stageRef: "dev",
});
