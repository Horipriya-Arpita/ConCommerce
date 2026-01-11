/**
 * Conversation History Storage Utility
 * Manages persistent conversation storage using localStorage
 */

import { Message } from './types';

const STORAGE_KEY = 'concommerce_conversations';
const MAX_CONVERSATIONS = 10; // Keep last 10 conversations

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  title?: string; // Auto-generated from first user message
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastUpdated: Date;
}

/**
 * Get all conversations from localStorage
 */
export function getAllConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const conversations = JSON.parse(stored);
    // Convert date strings back to Date objects
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const conversations = getAllConversations();
  return conversations.find(conv => conv.id === id) || null;
}

/**
 * Get current active conversation ID from sessionStorage
 */
export function getCurrentConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('current_conversation_id');
}

/**
 * Set current active conversation ID
 */
export function setCurrentConversationId(id: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('current_conversation_id', id);
}

/**
 * Create a new conversation
 */
export function createConversation(): Conversation {
  const newConversation: Conversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setCurrentConversationId(newConversation.id);
  return newConversation;
}

/**
 * Save or update a conversation
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return;

  try {
    const conversations = getAllConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);

    // Generate title from first user message if not set
    if (!conversation.title && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        conversation.title = firstUserMessage.content.substring(0, 50) +
          (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }

    conversation.updatedAt = new Date();

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }

    // Keep only last MAX_CONVERSATIONS
    const sortedConversations = conversations
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, MAX_CONVERSATIONS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedConversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const conversations = getAllConversations().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));

    // If deleted conversation was active, clear current ID
    if (getCurrentConversationId() === id) {
      sessionStorage.removeItem('current_conversation_id');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

/**
 * Clear all conversations
 */
export function clearAllConversations(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('current_conversation_id');
  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
}

/**
 * Get conversation summaries for listing
 */
export function getConversationSummaries(): ConversationSummary[] {
  const conversations = getAllConversations();
  return conversations.map(conv => ({
    id: conv.id,
    title: conv.title || 'New Conversation',
    messageCount: conv.messages.length,
    lastUpdated: conv.updatedAt
  }))
  .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
}

/**
 * Add a message to the current conversation
 */
export function addMessageToConversation(
  conversationId: string,
  message: Message
): void {
  const conversation = getConversation(conversationId);
  if (conversation) {
    conversation.messages.push(message);
    saveConversation(conversation);
  }
}

/**
 * Get conversation history formatted for LLM context
 * Returns last N messages formatted as a string
 */
export function getConversationContext(
  conversationId: string,
  maxMessages: number = 10
): string {
  const conversation = getConversation(conversationId);
  if (!conversation || conversation.messages.length === 0) {
    return '';
  }

  // Get last N messages (excluding the current one being processed)
  const recentMessages = conversation.messages.slice(-maxMessages);

  // Format as context string for LLM
  const contextLines = recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    // For assistant messages with products, just include the text response
    return `${role}: ${msg.content}`;
  });

  return contextLines.join('\n\n');
}
