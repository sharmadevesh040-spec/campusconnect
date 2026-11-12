export enum ResourceType {
  PDF = 'PDF',
  VIDEO = 'Video',
  WEBSITE = 'Website',
  DOCUMENT = 'Document',
  EXTERNAL_LINK = 'External Link'
}

export enum ResourceCategory {
  INTERVIEW_PREP = 'Interview Preparation',
  RESUME = 'Resume & Portfolio',
  TECHNICAL = 'Technical Workshops',
  COMMUNICATION = 'Communication',
  PROGRAM_GUIDELINES = 'Program Guidelines',
  FAQS = 'FAQs'
}

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType | string
  url: string
  category: ResourceCategory | string
  thumbnailURL?: string
  tags?: string[]
  fileSize?: string
  isFeatured?: boolean
  isPublic?: boolean
  createdAt: Date
  updatedAt: Date
}
