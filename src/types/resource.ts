export enum ResourceType {
  PDF = 'pdf',
  VIDEO = 'video',
  WEBSITE = 'website',
  DOCUMENT = 'document',
  EXTERNAL_LINK = 'external_link'
}

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  url: string
  category: string
  thumbnailURL: string
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}
