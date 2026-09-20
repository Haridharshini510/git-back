import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Checkpoint, CheckpointSummary, ProjectRecord, ContextSnapshot } from "./types.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
});
const dynamo = DynamoDBDocumentClient.from(client);

function tableName(): string {
  return process.env.GITBACK_TABLE || "claude-code-gitback";
}

export async function saveCheckpointCloud(
  userId: string,
  checkpoint: Checkpoint
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: `user#${userId}`,
        SK: `CHECKPOINT#${checkpoint.projectId}#${checkpoint.timestamp}`,
        GSI1PK: checkpoint.projectId,
        GSI1SK: checkpoint.timestamp,
        ...checkpoint,
      },
    })
  );
}

export async function loadLatestCheckpointCloud(
  userId: string,
  projectId: string
): Promise<Checkpoint | null> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": `CHECKPOINT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) return null;
  return result.Items[0] as unknown as Checkpoint;
}

export async function listCheckpointsCloud(
  userId: string,
  projectId: string,
  limit: number = 20
): Promise<CheckpointSummary[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": `CHECKPOINT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: limit,
      ProjectionExpression:
        "checkpointId, #ts, explicitNote, branch, commitSha, changedFiles, gitStatus",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
    })
  );

  if (!result.Items) return [];
  return result.Items.map((item: Record<string, unknown>) => ({
    checkpointId: item.checkpointId as string,
    timestamp: item.timestamp as string,
    note: item.explicitNote as string,
    branch: item.branch as string,
    commitSha: item.commitSha as string,
    fileCount:
      ((item.changedFiles as unknown[]) || []).length +
      (((item.gitStatus as Record<string, unknown>)?.untracked as unknown[]) || []).length,
  }));
}

export async function saveProjectRecord(
  userId: string,
  project: ProjectRecord
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: `user#${userId}`,
        SK: `PROJECT#${project.projectId}`,
        GSI1PK: project.repoFullName,
        GSI1SK: `user#${userId}`,
        ...project,
      },
    })
  );
}

export async function listProjectRecords(
  userId: string
): Promise<ProjectRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": "PROJECT#",
      },
    })
  );

  if (!result.Items) return [];
  return result.Items as unknown as ProjectRecord[];
}

export async function saveContextCloud(
  userId: string,
  context: ContextSnapshot
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: `user#${userId}`,
        SK: `CONTEXT#${context.projectId}#${context.timestamp}`,
        GSI1PK: context.projectId,
        GSI1SK: `CTX#${context.timestamp}`,
        ...context,
      },
    })
  );
}

export async function loadLatestContextCloud(
  userId: string,
  projectId: string
): Promise<ContextSnapshot | null> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": `CONTEXT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) return null;
  return result.Items[0] as unknown as ContextSnapshot;
}
