import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'

const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

// TODO: Implement businessLogic
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todosAccess.getUserTodos(userId)
}

export async function findTodoById(todoId: string): Promise<TodoItem> {
  return await todosAccess.findTodoById(todoId)
}

export async function createTodo(todo: CreateTodoRequest, userId: string): Promise<TodoItem> {
  let todoItem: TodoItem = {
    todoId: uuid.v4(),
    userId: userId,
    name: todo.name,
    dueDate: todo.dueDate,
    createdAt: new Date().toISOString(),
    attachmentUrl: null,
    done: false
  }

  return await todosAccess.createTodo(todoItem, userId)
}

export async function updateTodo(payload: UpdateTodoRequest, todoId: string, userId: string): Promise<void> {
  const todoItem = await findTodoById(todoId)

  if (!todoItem) throw new Error(`Todo with id [${todoId}] does not exist`)
  if (todoItem.userId !== userId) throw new Error('Todo does not belong to authenticated user')

  return await todosAccess.updateTodo(payload, todoId, userId)
}

export async function deleteTodo(todoId: string, userId: string): Promise<void> {
  const todoItem = await findTodoById(todoId)

  if (!todoItem) throw new Error(`Todo with id [${todoId}] does not exist`)
  if (todoItem.userId !== userId) throw new Error('Todo does not belong to authenticated user')

  return await todosAccess.deleteTodo(todoId, userId)
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
  const todoItem = await findTodoById(todoId)

  if (!todoItem) throw new Error(`Todo with id [${todoId}] does not exist`)
  if (todoItem.userId !== userId) throw new Error('Todo does not belong to authenticated user')

  return await attachmentUtils.generateUploadUrl(uuid.v4(), todoId, userId)
}
