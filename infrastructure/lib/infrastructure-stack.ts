import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Creates the AppSync API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-appsync-lambda-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
          }
        },
      },
      xrayEnabled: true,
    });
    
    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
     value: api.graphqlUrl
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });

    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });
    
    const bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: 'cdk-appsync-lambda-postgres',
      websiteIndexDocument: 'index.html', // 1
      // blockPublicAccess: new s3.BlockPublicAccess({ restrictPublicBuckets: false }) // 2
    });
    
    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'OAI');
    
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'CDKReactDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    })
    
    bucket.grantRead(cloudFrontOAI.grantPrincipal);
    
    

    // // 3
    // const bucketPolicy = new iam.PolicyStatement({
    //   actions: ['s3:GetObject'],
    //   resources: [
    //     `${bucket.bucketArn}/*`
    //   ],
    //   principals: [new iam.Anyone()],
    // })
    // bucket.addToResourcePolicy(bucketPolicy); // 4
    
  }
}