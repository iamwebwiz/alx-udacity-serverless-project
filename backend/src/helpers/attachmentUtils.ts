import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createDynamoDBClient } from './todosAcess'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({ signatureVersion: 'v4' })

// TODO: Implement the fileStogare logic
export class AttachmentUtils {
  constructor(
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly docClient: DocumentClient = createDynamoDBClient()
  ) {}

  async generateUploadUrl(imageId: string, todoId: string, userId: string): Promise<string> {
    const params = {
      TableName: this.todosTable,
      Key: { todoId, userId },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
      }
    }

    await this.docClient.update(params).promise()

    return s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: parseInt(this.signedUrlExpiration)
    })
  }
}
