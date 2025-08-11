export interface ToolCall {
  id: string
  name: string
  args: any
  result?: string
  status: "pending" | "completed" | "error"
}

export interface SubAgent {
  id: string
  name: string
  status: "pending" | "active" | "completed" | "error"
  subAgentName: string
  input: any
  output?: any
}

export interface FileItem {
  path: string
  content: string
}

export interface TodoItem {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed"
  createdAt?: Date
  updatedAt?: Date
}

export interface Thread {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}