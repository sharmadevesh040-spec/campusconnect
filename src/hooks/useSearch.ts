import { useState, useCallback } from 'react'
import { debounce } from '@/lib/utils'

export function useSearch<T>(items: T[], searchFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const debouncedSet = useCallback(debounce((q: unknown) => setDebouncedQuery(q as string), 300), [])

  function handleSearch(q: string) {
    setQuery(q)
    debouncedSet(q)
  }

  const filtered = debouncedQuery
    ? items.filter(item => searchFn(item, debouncedQuery.toLowerCase()))
    : items

  return { query, setQuery: handleSearch, filtered }
}
