const startImport = Date.now();
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

const logger = new Logger();

const metrics = new Metrics({
  namespace: 'api',
});

const tracer = new Tracer();

const stsClient = tracer.captureAWSv3Client(
  new STSClient({ region: process.env.AWS_REGION })
);

const importDuration = Date.now() - startImport;

function getIds(context) {
  const traceId = tracer.getRootXrayTraceId()
    ? { traceId: tracer.getRootXrayTraceId() }
    : {};
  return { ...traceId, requestId: context.awsRequestId };
}

export async function handler(event, context) {
  const handlerSegment = tracer.getSegment()?.addNewSubsegment('### handler');
  handlerSegment && tracer.setSegment(handlerSegment);
  let success = true;
  let isLayer = require('fs').existsSync(
    '/opt/nodejs/node_modules/@aws-lambda-powertools'
  );
  let coldStartImportInit = tracer.isColdStart()
    ? { coldStartImportInit: importDuration }
    : {};
  const message =
    'Hello. My name is Inigo Montoya. You killed my father. Prepare to die.';
  let callDuration = Date.now();
  try {
    const result = await stsClient.send(new GetCallerIdentityCommand({}));
    callDuration = Date.now() - callDuration;
    logger.info(`Issuing the following statement: ${message}`, {
      callDuration,
      isLayer,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message,
        callerIdentity: result,
        ...getIds(context),
        ...coldStartImportInit,
        callDuration,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    logger.error('Inconceivable! I failed to issue my threat!', err);
    success = false;
    return {
      statusCode: 500,
      body: JSON.stringify({
        message,
        ...getIds(context),
        ...coldStartImportInit,
        callDuration,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } finally {
    metrics.addMetadata('callDuration', callDuration);
    if (tracer.isColdStart()) {
      metrics.addMetadata('coldStartImportInit', coldStartImportInit);
    }
    metrics.addMetadata('xrayId', tracer.getRootXrayTraceId());
    metrics.addMetadata('isLayer', isLayer);
    metrics.addMetric('success', success ? 1 : 0, MetricUnits.Count);
    tracer.putAnnotation('isLayer', isLayer);
    handlerSegment?.close();
    handlerSegment && tracer.setSegment(handlerSegment?.parent);
    metrics.publishStoredMetrics();
  }
}
