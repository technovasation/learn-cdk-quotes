import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'; 
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';


export class CdkQuotesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'quotes-tbl', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const handlerFunction = new Function(this, 'quotesHandler', {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(join(__dirname, '../lambdas')),
      handler: 'app.handler',
      environment: {
        MY_TABLE: table.tableName
      }
    });

    table.grantReadWriteData(handlerFunction);
    
    const api = new RestApi(this, 'quotesApi', {
      description: 'This service serves quotes',
    });

    // Integration
    const handlerIntegration = new LambdaIntegration(handlerFunction);

    const mainPath = api.root.addResource("quotes");

    mainPath.addMethod('GET', handlerIntegration);
    mainPath.addMethod('POST', handlerIntegration);

  }
}
