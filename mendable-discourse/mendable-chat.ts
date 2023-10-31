export interface ChatResponse {
    answer: Answer
    sources: Source[]
    message_id: number
  }
  
  export interface Answer {
    text: string
  }
  
  export interface Source {
    content: string
    date: any
    id: number
    link: string
    metadata: Metadata
    source_name: any
    text: string
    relevance_score: number
  }
  
  export interface Metadata {}

  export interface Conversation {
    conversation_id: number
  }

  export interface History {
    prompt: string
    response: string
  }