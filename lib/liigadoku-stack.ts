import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PlayerData } from "./player-data";
import { PlayersRestApi } from "./players-rest-api";
import { LiigadokuHosting } from "./hosting";
import { SPADeploy } from "cdk-spa-deploy";

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

    new SPADeploy(this, "spaDeploy", {
      encryptBucket: true,
    }).createSiteFromHostedZone({
      zoneName: "liigadoku.com",
      indexDoc: "index.html",
      websiteFolder: "./front/build",
    });

    // new LiigadokuHosting(this, "hosting", {
    //   hostedZoneName: "liigadoku.com",
    //   domainName: "liigadoku.com",
    //   includeWWW: true,
    //   siteSourcePath: "./front/build",
    //   staticSiteBucketNameOutputId: "bucket-name",
    //   staticSiteDistributionIdOutputId: "distribution-id",
    // });
  }
}
