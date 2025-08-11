import type { SubAgent } from "../types/types"
import { Message } from "@langchain/langgraph-sdk"

export function extractStringFromMessageContent(message: Message): string {
  return typeof message.content === 'string' 
  ? message.content 
  : Array.isArray(message.content) 
    ? message.content
        .filter((c: any) => c.type === 'text' || typeof c === 'string')
        .map((c: any) => typeof c === 'string' ? c : c.text || '')
        .join('')
    : ''
}


export function convertTaskToolCallsToSubAgents(message: any, allMessages: any[]): SubAgent[] {
  const subAgents: SubAgent[] = []
  let toolCalls: any[] = []
  
  // Extract tool calls from different formats
  if (message.additional_kwargs?.tool_calls) {
    toolCalls = message.additional_kwargs.tool_calls
  } else if (message.tool_calls) {
    toolCalls = message.tool_calls
  }
  
  toolCalls.forEach((toolCall, index) => {
    if (toolCall.function?.name === "task" || toolCall.name === "task") {
      const taskArgs = toolCall.function?.arguments || toolCall.args || "{}"
      let parsedArgs: any = {}

      try {
        parsedArgs = typeof taskArgs === "string" ? JSON.parse(taskArgs) : taskArgs
      } catch (e) {
        console.warn("Failed to parse task arguments:", taskArgs)
      }

      if (!parsedArgs.subagent_type) {
        return
      }
      
      // Extract input and output for the task
      const taskInput = parsedArgs.description || parsedArgs.task || "Processing..."
      const agentName = parsedArgs.subagent_type || "Sub-Agent"    

      // Find the corresponding tool return message and AI response
      const taskToolCallId = toolCall.id
      const returnMessageIndex = allMessages.findIndex((m: any) => {
        return m.type === "tool" && m.tool_call_id === taskToolCallId
      })
      
      let taskOutput = ""
      
      // Look for the AI message that comes after the tool return
      if (returnMessageIndex !== -1 && returnMessageIndex < allMessages.length - 1) {
        const nextMessage = allMessages[returnMessageIndex + 1]
        if (nextMessage.type === "ai") {
          // Extract text content from AI message
          if (typeof nextMessage.content === "string") {
            taskOutput = nextMessage.content
          } else if (Array.isArray(nextMessage.content)) {
            const textBlocks = nextMessage.content.filter((block: any) => block.type === "text")
            taskOutput = textBlocks.map((block: any) => block.text).join("\n\n")
          }
        }
      }
      
      // If we didn't find an AI message, fall back to the tool return content
      if (!taskOutput && returnMessageIndex !== -1) {
        const returnMessage = allMessages[returnMessageIndex]
        if (returnMessage.content) {
          try {
            const parsed = JSON.parse(returnMessage.content)
            if (Array.isArray(parsed) && parsed[0]?.text) {
              taskOutput = parsed[0].text
            } else if (parsed.text) {
              taskOutput = parsed.text
            } else {
              taskOutput = returnMessage.content
            }
          } catch {
            taskOutput = returnMessage.content
          }
        }
      }
      
      const subAgent: SubAgent = {
        id: toolCall.id || `task-${index}`,
        name: "Task",
        status: taskOutput ? "completed" : "active",
        subAgentName: agentName,
        input: taskInput,
        output: taskOutput || undefined
      }
      
      subAgents.push(subAgent)
    }
  })
  
  return subAgents
}