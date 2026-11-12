import { apiRequest } from './api'
import type { Resource } from '@/types'
import { ResourceCategory, ResourceType } from '@/types/resource'

const CACHE_KEY = 'campusconnect_resources_cache'

function mapRes(item: any): Resource {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    category: item.category || ResourceCategory.INTERVIEW_PREP,
    type: item.type || ResourceType.PDF,
    url: item.url,
    fileSize: item.fileSize || '1.2 MB',
    tags: [item.category || 'General'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export async function getResources(category?: string): Promise<Resource[]> {
  try {
    const list = await apiRequest<any[]>('/api/student/resources')
    let mapped = list.map(mapRes)
    if (category) {
      mapped = mapped.filter(r => r.category.toLowerCase() === category.toLowerCase())
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(mapped))
    return mapped
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: Resource[] = JSON.parse(cached)
      if (category) return parsed.filter(r => r.category.toLowerCase() === category.toLowerCase())
      return parsed
    }
    return []
  }
}

export async function createResource(data: any): Promise<string> {
  const res = await apiRequest<any>('/api/admin/resources', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      url: data.url
    })
  })
  return res.id
}

export async function deleteResource(id: string): Promise<void> {
  await apiRequest(`/api/admin/resources/${id}`, { method: 'DELETE' })
}
