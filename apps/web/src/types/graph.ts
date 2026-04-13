import type { Node } from '@xyflow/react';

export type AgentNodeType =
  | 'start'
  | 'thinking'
  | 'toolCall'
  | 'toolResult'
  | 'response'
  | 'done'
  | 'error';

export interface StartNodeData { message: string; [key: string]: unknown }
export interface ThinkingNodeData { content: string; [key: string]: unknown }
export interface ToolCallNodeData { toolCallId: string; tool: string; args: Record<string, unknown>; [key: string]: unknown }
export interface ToolResultNodeData { toolCallId: string; tool: string; result: string; isError: boolean; [key: string]: unknown }
export interface ResponseNodeData { text: string; [key: string]: unknown }
export interface DoneNodeData { inputTokens: number; outputTokens: number; costUsd: number; model: string; iterations: number; [key: string]: unknown }
export interface ErrorNodeData { message: string; [key: string]: unknown }

export type AgentNode =
  | Node<StartNodeData, 'start'>
  | Node<ThinkingNodeData, 'thinking'>
  | Node<ToolCallNodeData, 'toolCall'>
  | Node<ToolResultNodeData, 'toolResult'>
  | Node<ResponseNodeData, 'response'>
  | Node<DoneNodeData, 'done'>
  | Node<ErrorNodeData, 'error'>;
