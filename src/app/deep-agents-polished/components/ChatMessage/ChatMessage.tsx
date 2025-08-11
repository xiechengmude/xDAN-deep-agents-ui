"use client"

import React from "react"
import { User, Bot } from "lucide-react"
import { SubAgentIndicator } from "../SubAgentIndicator/SubAgentIndicator"
import { ToolCallBox } from "../ToolCallBox/ToolCallBox"
import { MarkdownContent } from "../MarkdownContent/MarkdownContent"
import type { SubAgent, ToolCall } from "../../types/types"
import styles from "./ChatMessage.module.scss"
import { Message } from "@langchain/langgraph-sdk"
import { extractStringFromMessageContent } from "../../utils/utils"

interface ChatMessageProps {
  message: Message
  toolCallsWithStatus: ToolCall[]
  subAgents: SubAgent[]
  showAvatar: boolean
  onSelectSubAgent: (subAgentId: string) => void
}

export const ChatMessage = React.memo<ChatMessageProps>(({ 
  message, 
  toolCallsWithStatus,
  subAgents,
  showAvatar,
  onSelectSubAgent,
}) => {  
  const isUser = message.type === "human"
  const messageContent = extractStringFromMessageContent(message)
  const hasContent = messageContent && messageContent.trim() !== ""
  const hasToolCalls = toolCallsWithStatus.length > 0
  const hasSubAgents = !isUser && subAgents.length > 0
  
  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
      <div className={`${styles.avatar} ${!showAvatar ? styles.avatarHidden : ''}`}>
        {showAvatar && (
          isUser ? (
            <User className={styles.avatarIcon} />
          ) : (
            <Bot className={styles.avatarIcon} />
          )
        )}
      </div>
      <div className={styles.content}>
        {hasContent && (
          <div className={styles.bubble}>
            {isUser ? (
              <p className={styles.text}>{messageContent}</p>
            ) : (
              <MarkdownContent content={messageContent} />
            )}
          </div>
        )}
        {hasToolCalls && (
          <div className={styles.toolCalls}>
            {toolCallsWithStatus.map((toolCall) => {
              if (toolCall.name === "task") return null
              return (
                <ToolCallBox 
                  key={toolCall.id} 
                  toolCall={toolCall}
                />
              )
            })}
          </div>
        )}
        {hasSubAgents && (
          <div className={styles.subAgents}>
            {subAgents.map((subAgent) => (
              <SubAgentIndicator 
                key={subAgent.id} 
                subAgent={subAgent} 
                onClick={() => onSelectSubAgent(subAgent.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

ChatMessage.displayName = "ChatMessage"