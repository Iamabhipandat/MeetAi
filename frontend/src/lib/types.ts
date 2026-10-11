export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  is_verified?: boolean
  created_at: string
}

export interface Meeting {
  id: number
  title: string
  description?: string
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED'
  created_at: string
  started_at?: string
  ended_at?: string
}

export interface Transcript {
  id: number
  meeting_id: number
  speaker: string
  content: string
  timestamp: string
  sequence_number: number
}

export interface Question {
  id: number
  meeting_id: number
  transcript_id: number
  question_text: string
  speaker: string
  status: 'UNANSWERED' | 'ANSWERED' | 'DUPLICATE' | 'IGNORED'
  is_duplicate: boolean
  duplicate_of?: number
  similarity_score?: number
  created_at: string
}

export interface AIResponse {
  id: number
  question_id: number
  response_text: string
  confidence_score?: number
  created_at: string
}

export interface MeetingSummary {
  id: number
  meeting_id: number
  summary_text: string
  generated_at: string
}

export interface SearchResult {
  transcript_id: number
  meeting_id: number
  meeting_title: string
  speaker: string
  content: string
  relevance_score: number
}

export interface MeetingAnalytics {
  meeting_id: number
  title: string
  total_transcripts: number
  total_questions: number
  answered_questions: number
  unanswered_questions: number
  duplicate_questions: number
  has_summary: boolean
}

export interface OverallAnalytics {
  total_meetings: number
  total_transcripts: number
  total_questions: number
  answered_questions: number
  unanswered_questions: number
  duplicate_questions: number
  meetings: MeetingAnalytics[]
}
