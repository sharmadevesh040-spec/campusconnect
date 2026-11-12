import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, Video, Globe } from 'lucide-react'
import { useResources } from '@/hooks/useResources'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ResourceType } from '@/types/resource'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'Interview Preparation', 'Resume', 'Communication', 'Technical', 'Ambassador Guidelines', 'FAQs']

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [ResourceType.PDF]: <FileText className="w-4 h-4" />,
  [ResourceType.VIDEO]: <Video className="w-4 h-4" />,
  [ResourceType.WEBSITE]: <Globe className="w-4 h-4" />,
  [ResourceType.DOCUMENT]: <FileText className="w-4 h-4" />,
  [ResourceType.EXTERNAL_LINK]: <ExternalLink className="w-4 h-4" />,
}

export default function ResourcesPage() {
  const { resources, loading } = useResources()
  const [category, setCategory] = useState('All')

  const filtered = resources.filter(r => category === 'All' || r.category.toLowerCase() === category.toLowerCase())

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Resources</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Study materials, guidelines, and preparation documents</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              category === cat
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="📚" title="No resources found" description="Resources for this category will appear here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(resource => (
            <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer">
              <Card hover className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      resource.type === ResourceType.VIDEO ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                      resource.type === ResourceType.PDF ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                    )}>
                      {TYPE_ICONS[resource.type] || <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1">{resource.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{resource.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                  <Badge variant="default" className="text-[10px]">{resource.category}</Badge>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    {resource.type}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
