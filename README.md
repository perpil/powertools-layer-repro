# Prerequisites

1. You need the [serverless framework](https://www.serverless.com/framework/docs/getting-started) installed globally
   ```bash
   npm install -g serverless
   ```
2. Set your AWS credentials as environment variables using Isengard

# Build

Run this before deploying or testing locally

```
npm install
```

# Testing locally

```
sls invoke local --function api --path events/event.json
```

# Deploy

Every time you call deploy, it changes an environment variable force it to redeploy each time. To disable comment out the following line in [`serverless.yml`](serverless.yml):

`DEPLOYMENT_ID: Deployment-${sls:instanceId}`

to comment use `#` at the beginning of the line

```
sls deploy
```

# Switching between layer and esbuild

To switch between layer and esbuild

1. Comment out the layer in [`serverless.yml`](serverless.yml)
   ```
   #layers:
   #  - !Sub 'arn:aws:lambda:${AWS::Region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:21'
   ```
2. Comment out the exclude section in [`serverless.yml`](serverless.yml)
   ```
   #exclude:
    #- '@aws-lambda-powertools'
    #- 'aws-xray-sdk-core'
   ```
   The code autodetects whether it is using a layer or not and sets a `isLayer` flag in the log, tracer annotation and metrics metadata.
3. Redeploy

# What does the code do

The code imports the metrics, tracer and logger libraries and instantiates them. It creates an sts client and wraps it with the tracer. In the handler it calls getCallerIdentity to return some info to the caller and uses the metrics, tracer and logger libraries. [Code](index.js)

# Benchmarking

If you don't want to manually deploy and look at the traces and logs, there are tools to help. The [SDK blog post on reducing cold start times](https://aws.amazon.com/blogs/developer/reduce-lambda-cold-start-times-migrate-to-aws-sdk-for-javascript-v3/) uses a modified version of this code for the benchmarking:
https://github.com/lumigo-io/SAR-measure-cold-start It will change environment variables to force a cold start and invoke the function multiple times and report the results.
