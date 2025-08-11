"use client"

import React, { useState, useRef, useCallback, useMemo, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, LoaderCircle, SquarePen, History, X } from "lucide-react"
import { ChatMessage } from "../ChatMessage/ChatMessage"
import { ThreadHistorySidebar } from "../ThreadHistorySidebar/ThreadHistorySidebar"
import type { SubAgent, TodoItem, ToolCall } from "../../types/types"
import { useChat } from "../../hooks/useChat"
import { convertTaskToolCallsToSubAgents } from "../../utils/utils"
import styles from "./ChatInterface.module.scss"

interface ChatInterfaceProps {
  threadId: string | null
  setThreadId: (value: string | ((old: string | null) => string | null) | null) => void
  onSelectSubAgent: (subAgentId: string) => void
  onSubAgentsUpdate: (subAgents: SubAgent[]) => void
  onTodosUpdate: (todos: TodoItem[]) => void
  onFilesUpdate: (files: Record<string, string>) => void
  onNewThread: () => void
  isLoadingThreadState: boolean
}

export const ChatInterface = React.memo<ChatInterfaceProps>(({
  threadId,
  setThreadId,
  onSelectSubAgent,
  onSubAgentsUpdate,
  onTodosUpdate,
  onFilesUpdate,
  onNewThread,
  isLoadingThreadState
}) => {
  const [input, setInput] = useState("")
  const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    isLoading,
    sendMessage,
    stopStream
  } = useChat(threadId, setThreadId, onTodosUpdate, onFilesUpdate)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    const messageText = input.trim()
    if (!messageText || isLoading) return
    sendMessage(messageText)
    setInput("")
  }, [input, isLoading, sendMessage])

  const handleNewThread = useCallback(() => {
    // Cancel any ongoing thread when creating new thread
    if (isLoading) {
      stopStream()
    }
    setIsThreadHistoryOpen(false)
    onNewThread()
  }, [isLoading, stopStream, onNewThread])

  const handleThreadSelect = useCallback((id: string) => {
    setThreadId(id)
    setIsThreadHistoryOpen(false)
  }, [setThreadId])

  const toggleThreadHistory = useCallback(() => {
    setIsThreadHistoryOpen(prev => !prev)
  }, [])

  const hasMessages = messages.length > 0

  // Process messages to extract tool calls and create SubAgents
  const processedMessages = useMemo(() => {
    const messageMap = new Map<string, any>()
    messages.forEach(message => {
      if (message.type === 'ai') {
        const toolCalls: any[] = []
        if (message.additional_kwargs?.tool_calls && Array.isArray(message.additional_kwargs.tool_calls)) {
          toolCalls.push(...message.additional_kwargs.tool_calls)
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCalls.push(...message.tool_calls.filter((toolCall: any) => toolCall.name !== ''))
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter((block: any) => block.type === 'tool_use')
          toolCalls.push(...toolUseBlocks)
        }
        // Filter out task tool calls (they become SubAgents)
        const regularToolCalls = toolCalls.filter(tc => 
          (tc.function?.name || tc.name) !== "task"
        )
        const toolCallsWithStatus = regularToolCalls.map((toolCall: any) => {
          const name = toolCall.function?.name || toolCall.name || toolCall.type || 'unknown'
          const args = toolCall.function?.arguments || toolCall.args || toolCall.input || {}
          return {
            id: toolCall.id || `tool-${Math.random()}`,
            name,
            args,
            status: 'pending' as const,
          } as ToolCall
        })
        const subAgents = convertTaskToolCallsToSubAgents(message, messages)
        
        messageMap.set(message.id!, {
          message,
          toolCalls: toolCallsWithStatus,
          subAgents
        })
      } else if (message.type === 'tool') {
        const toolCallId = message.tool_call_id
        if (toolCallId) {
          for (const [, data] of messageMap.entries()) {
            const toolCallIndex = data.toolCalls.findIndex((tc: any) => tc.id === toolCallId)
            if (toolCallIndex !== -1) {
              data.toolCalls[toolCallIndex] = {
                ...data.toolCalls[toolCallIndex],
                status: 'completed' as const,
                result: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
              }
              break
            }
          }
        }
      } else {
        messageMap.set(message.id!, {
          message,
          toolCalls: [],
          subAgents: []
        })
      }
    })
    const processedArray = Array.from(messageMap.values())
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type
      }
    })
  }, [messages])
  
  const allSubAgents = useMemo(() => {
    return processedMessages.flatMap(data => data.subAgents || [])
  }, [processedMessages])
  
  const memoizedSubAgents = useMemo(() => {
    return JSON.stringify(allSubAgents)
  }, [allSubAgents])
  
  useEffect(() => {
    if (onSubAgentsUpdate) {
      onSubAgentsUpdate(allSubAgents)
    }
  }, [memoizedSubAgents, onSubAgentsUpdate])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bot className={styles.logo} />
          <h1 className={styles.title}>Deep Agents</h1>
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewThread}
            disabled={!hasMessages}
          >
            <SquarePen size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleThreadHistory}
          >
            <History size={20}/>
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <ThreadHistorySidebar
          open={isThreadHistoryOpen}
          setOpen={setIsThreadHistoryOpen}
          currentThreadId={threadId}
          onThreadSelect={handleThreadSelect}
        />
        <div className={styles.messagesContainer}>
          {!hasMessages && !isLoading && !isLoadingThreadState && (
            <div className={styles.emptyState}>
              <Bot size={48} className={styles.emptyIcon} />
              <h2>Start a conversation or select a thread from history</h2>
            </div>
          )}
          {isLoadingThreadState && (
            <div className={styles.threadLoadingState}>
              <LoaderCircle className={styles.threadLoadingSpinner} />
            </div>
          )}
          <div className={styles.messagesList}>
            {processedMessages.map((data) => (
              <ChatMessage
                key={data.message.id}
                message={data.message}
                toolCallsWithStatus={data.toolCalls}
                subAgents={data.subAgents}
                showAvatar={data.showAvatar}
                onSelectSubAgent={onSelectSubAgent}
              />
            ))}
            {isLoading && (
              <div className={styles.loadingMessage}>
                <LoaderCircle className={styles.spinner} />
                <span>Working...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className={styles.input}
        />
        {isLoading ? (
          <Button
            type="button"
            onClick={stopStream}
            className={styles.stopButton}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim()}
            className={styles.sendButton}
          >
            <Send size={16} />
          </Button>
        )}
      </form>
    </div>
  )
})

ChatInterface.displayName = "ChatInterface"