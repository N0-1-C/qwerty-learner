import { customWordListAtom } from '@/store'
import type { Dictionary, WordWithIndex } from '@/typings'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'

export default function WordSelection({ dict, onStartPractice }: { dict: Dictionary; onStartPractice: () => void }) {
  const { data: wordList, error, isLoading } = useSWR(dict.url, wordListFetcher)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [customWordList, setCustomWordList] = useAtom(customWordListAtom)

  const filteredWords = useMemo(() => {
    if (!wordList) return []
    if (!searchText.trim()) return wordList
    const lower = searchText.toLowerCase()
    return wordList.filter(
      (w) =>
        w.name.toLowerCase().includes(lower) ||
        (Array.isArray(w.trans) && w.trans.some((t) => t.toLowerCase().includes(lower))),
    )
  }, [wordList, searchText])

  const isAllSelected = useMemo(() => {
    if (filteredWords.length === 0) return false
    return filteredWords.every((w) => selectedWords.has(w.name))
  }, [filteredWords, selectedWords])

  const toggleWord = useCallback((wordName: string) => {
    setSelectedWords((prev) => {
      const next = new Set(prev)
      if (next.has(wordName)) {
        next.delete(wordName)
      } else {
        next.add(wordName)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedWords(new Set())
    } else {
      setSelectedWords(new Set(filteredWords.map((w) => w.name)))
    }
  }, [isAllSelected, filteredWords])

  const selectAllFiltered = useCallback(() => {
    setSelectedWords((prev) => {
      const next = new Set(prev)
      filteredWords.forEach((w) => next.add(w.name))
      return next
    })
  }, [filteredWords])

  const deselectAllFiltered = useCallback(() => {
    setSelectedWords((prev) => {
      const next = new Set(prev)
      filteredWords.forEach((w) => next.delete(w.name))
      return next
    })
  }, [filteredWords])

  const startPractice = useCallback(() => {
    if (!wordList) return
    const selected: WordWithIndex[] = wordList
      .filter((w) => selectedWords.has(w.name))
      .map((word, index) => {
        let trans: string[]
        if (Array.isArray(word.trans)) {
          trans = word.trans.filter((item) => typeof item === 'string')
        } else if (word.trans === null || word.trans === undefined || typeof word.trans === 'object') {
          trans = []
        } else {
          trans = [String(word.trans)]
        }
        return { ...word, index, trans }
      })
    setCustomWordList(selected)
    onStartPractice()
  }, [wordList, selectedWords, setCustomWordList, onStartPractice])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-400 border-r-transparent" />
      </div>
    )
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-red-500">加载词库失败，请稍后重试</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="搜索单词或翻译..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          已选 {selectedWords.size} / {wordList?.length ?? 0} 词
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={toggleAll}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {isAllSelected ? '取消全选' : '全选当前'}
        </button>
        <button
          onClick={selectAllFiltered}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          选中搜索结果
        </button>
        <button
          onClick={deselectAllFiltered}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          取消搜索结果
        </button>
        <div className="flex-1" />
        {selectedWords.size > 0 && (
          <button
            onClick={startPractice}
            className="rounded-md bg-indigo-500 px-4 py-1 text-sm text-white transition-colors hover:bg-indigo-600"
          >
            开始练习 ({selectedWords.size} 词)
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredWords.map((word) => {
            const isSelected = selectedWords.has(word.name)
            return (
              <div
                key={word.name}
                onClick={() => toggleWord(word.name)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleWord(word.name)}
                  className="h-4 w-4 accent-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-gray-800 dark:text-gray-200">{word.name}</span>
                  {word.trans && word.trans.length > 0 && (
                    <span className="block truncate text-xs text-gray-400">
                      {Array.isArray(word.trans) ? word.trans[0] : word.trans}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {filteredWords.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">未找到匹配的单词</div>
        )}
      </div>
    </div>
  )
}