import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { BookOpen, Plus, ExternalLink, Trash2, Search, FileText } from 'lucide-react'
import { getResources, createResource, deleteResource } from '@/services/resourceService'
import type { Resource } from '@/types'
import { toast } from 'sonner'

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Interview Preparation',
    type: 'PDF',
    url: ''
  })

  const loadResources = async () => {
    setLoading(true)
    try {
      const data = await getResources()
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.url) {
      toast.error('Title and URL are required')
      return
    }

    try {
      await createResource(formData)
      toast.success('Resource published to students! 📚')
      setIsModalOpen(false)
      setFormData({ title: '', description: '', category: 'Interview Preparation', type: 'PDF', url: '' })
      loadResources()
    } catch {
      toast.error('Failed to create resource')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this resource?')) return
    try {
      await deleteResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
      toast.success('Resource removed')
    } catch {
      toast.error('Failed to delete resource')
    }
  }

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Learning & Program Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publish official guidelines, PDFs, and interview preparation materials for student ambassadors.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((res) => (
          <Card key={res.id} className="p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="blue" className="text-[10px]">{res.category}</Badge>
                <Badge variant="outline" className="text-[10px] uppercase">{res.type}</Badge>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{res.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{res.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Resource
              </a>
              <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(res.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish Learning Resource">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resource Title</label>
            <Input
              required
              placeholder="e.g. STAR Framework Mastery Guide"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="Interview Preparation">Interview Preparation</option>
              <option value="Program Guidelines">Program Guidelines</option>
              <option value="Resume & Portfolio">Resume & Portfolio</option>
              <option value="Technical Workshops">Technical Workshops</option>
              <option value="FAQs">FAQs</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resource URL / PDF Link</label>
            <Input
              required
              placeholder="https://example.com/guide.pdf"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <Input
              placeholder="Brief explanation of the material"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Publish Resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
