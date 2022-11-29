import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable: string = process.env.TODOS_TABLE,
    private readonly todosIndex: string = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async getUserTodos(userId: string): Promise<TodoItem[]> {
    logger.info(`Retrieving todos for user [${userId}]`)

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    logger.info(`Todos for user [${userId}] retrieved successfully`)

    return result.Items as TodoItem[]
  }

  async findTodoById(todoId: string): Promise<TodoItem> {
    logger.info(`Running lookup for todo item [${todoId}]`)
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId
        }
      })
      .promise()

    return result.Item as TodoItem
  }

  async createTodo(todoItem: TodoItem, userId: string): Promise<TodoItem> {
    logger.info(`Creating a new todo item for user [${userId}]`)
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    logger.info('Todo item created successfully')

    return todoItem
  }

  async updateTodo(payload: TodoUpdate, todoId: string, userId: string): Promise<void> {
    logger.info(`Updating todo item [${todoId}]`)
    const params = {
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': payload?.name,
        ':dueDate': payload?.dueDate,
        ':done': payload?.done
      },
      ReturnValues: 'UPDATED_NEW'
    }

    await this.docClient.update(params).promise()

    logger.info(`Todo item [${todoId}] updated successfully`)
  }

  async deleteTodo(todoId: string, userId: string): Promise<void> {
    logger.info(`Deleting todo item [${todoId}]`)

    const params = {
      TableName: this.todosTable,
      Key: { todoId, userId }
    }

    await this.docClient.delete(params).promise()
  }
}

export function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
