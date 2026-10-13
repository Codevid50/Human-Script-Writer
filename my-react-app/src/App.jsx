import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Clock,
  Copy,
  FileText,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react'

const formats = [
  { id: 'short_form', label: 'Short-form', detail: 'Reels / TikTok' },
  { id: 'long_form', label: 'YouTube', detail: 'Long-form' },
]

const durations = [
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
]

const loadingMessages = [
  'Crafting high-impact hook...',
  'Finding the right story arc...',
  'Optimizing pacing...',
  'Polishing your final script...',
]

function App() {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('short_form')
  const [duration, setDuration] = useState(60)
  const [mainPoints, setMainPoints] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [scriptResult, setScriptResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const requestController = useRef(null)
  const copiedTimeout = useRef(null)

  useEffect(() => {
    if (!loading) return undefined

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % loadingMessages.length)
    }, 2100)

    return () => window.clearInterval(interval)
  }, [loading])

  useEffect(
    () => () => {
      requestController.current?.abort()
      window.clearTimeout(copiedTimeout.current)
    },
    [],
  )

  function updateMainPoint(index, value) {
    setMainPoints((points) =>
      points.map((point, pointIndex) => (pointIndex === index ? value : point)),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setCopied(false)

    const normalizedTopic = topic.trim()
    if (!normalizedTopic) {
      setError('Add a topic to get started.')
      return
    }

    

    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setLoading(true)
    setLoadingMessageIndex(0)

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: normalizedTopic,
          description: description.trim(),
          content_type: contentType,
          duration: String(duration),
          main_points: mainPoints.map((point) => point.trim()).filter(Boolean),
        }),
        signal: controller.signal,
      })

      const responseText = await response.text()
      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch {
        throw new Error('The server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || `The server returned an error (${response.status}).`,
        )
      }
      if (typeof data.script !== 'string' || !data.script.trim()) {
        throw new Error('The server response did not include a script. Please try again.')
      }

      setScriptResult({
        script: data.script,
        contentType: data.content_type,
        wordCount: data.word_count,
        readingTime: data.reading_time_minutes,
      })
    } catch (requestError) {
      if (requestError.name === 'AbortError') return

      setError(
        requestError instanceof TypeError
          ? 'Could not reach the generation server. Check that it is running and that the backend URL is correct.'
          : requestError.message || 'Something went wrong while generating your script.',
      )
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  async function handleCopy() {
    if (!scriptResult?.script) return

    try {
      await navigator.clipboard.writeText(scriptResult.script)
      setCopied(true)
      window.clearTimeout(copiedTimeout.current)
      copiedTimeout.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the script. Check your browser clipboard permissions.')
    }
  }

  const selectedFormat = formats.find((format) => format.id === scriptResult?.contentType)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-360 px-5 py-6 sm:px-8 lg:px-10">
        <header className="mb-8 flex items-center justify-between border-b border-slate-800/80 pb-6">
          <a href="#" className="flex items-center gap-3" aria-label="Human Script System home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">
                HUMAN SCRIPT
              </span>
              <span className="block text-xs tracking-[0.18em] text-slate-500">
                SYSTEM
              </span>
            </span>
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Your next great story starts here
          </div>
        </header>

        <section className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Script studio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Turn your idea into
            <span className="text-indigo-300"> a story worth watching.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Build a thoughtful, audience-ready script in seconds. Bring your idea; we&apos;ll help
            shape the words.
          </p>
        </section>

        {error && (
          <div
            className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              className="shrink-0 rounded text-rose-200/70 hover:text-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.35fr)]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 sm:p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Script brief</h2>
                <p className="mt-1 text-sm text-slate-400">Start with the essentials.</p>
              </div>
              <button
                type="button"
                aria-expanded={settingsOpen}
                aria-controls="backend-settings"
                onClick={() => setSettingsOpen((open) => !open)}
                className={`rounded-lg border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                  settingsOpen
                    ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
                aria-label="Backend settings"
              >
                <Settings size={17} aria-hidden="true" />
              </button>
            </div>

<form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="topic" className="mb-2 block text-sm font-medium text-slate-200">
                  What&apos;s your video about? <span className="text-indigo-300">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. Why your morning routine isn't working"
                  required
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  A little more context <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Audience, tone, key takeaway, or anything else to keep in mind..."
                  rows={3}
                  maxLength={1200}
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15"
                />
                <p className="mt-1.5 text-right text-xs text-slate-600">
                  {description.length}/1200
                </p>
              </div>

              <fieldset>
                <legend className="mb-2.5 text-sm font-medium text-slate-200">Video format</legend>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-1.5">
                  {formats.map((format) => {
                    const isSelected = contentType === format.id
                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setContentType(format.id)}
                        aria-pressed={isSelected}
                        className={`rounded-lg px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                          isSelected
                            ? 'bg-indigo-500/15 text-indigo-100 ring-1 ring-inset ring-indigo-400/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <span className="block text-sm font-medium">{format.label}</span>
                        <span className="mt-0.5 block text-xs opacity-70">{format.detail}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="duration" className="mb-2 block text-sm font-medium text-slate-200">
                  Target duration
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15"
                >
                  {durations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <div className="mb-2.5 flex items-center justify-between">
                  <legend className="text-sm font-medium text-slate-200">Main points</legend>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>
                <div className="space-y-2">
                  {mainPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-medium text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={point}
                        onChange={(event) => updateMainPoint(index, event.target.value)}
                        placeholder="Add a key idea..."
                        aria-label={`Main point ${index + 1}`}
                        maxLength={240}
                        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMainPoints((points) => points.filter((_, pointIndex) => pointIndex !== index))
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                        aria-label={`Remove main point ${index + 1}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMainPoints((points) => [...points, ''])}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-400/10 hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add a point
                </button>
              </fieldset>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                    Creating your script
                  </>
                ) : (
                  <>
                    <Sparkles size={17} aria-hidden="true" />
                    Generate script
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-600">
                Your ideas stay yours. Make every word your own.
              </p>
            </form>
          </section>

          <section
            className="flex min-h-140 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10"
            aria-label="Generated script"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-white">Your script</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {scriptResult ? 'Made for your voice and your audience.' : 'Your finished draft will appear here.'}
                </p>
              </div>
              {scriptResult && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                    copied
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={15} aria-hidden="true" />
                      Copy script
                    </>
                  )}
                </button>
              )}
            </div>

            {scriptResult && (
              <div className="flex flex-wrap gap-2 border-b border-slate-800/80 px-5 py-3 sm:px-6">
                {typeof scriptResult.wordCount === 'number' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
                    <FileText size={13} className="text-indigo-300" aria-hidden="true" />
                    {scriptResult.wordCount.toLocaleString()} words
                  </span>
                )}
                {typeof scriptResult.readingTime === 'number' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
                    <Clock size={13} className="text-indigo-300" aria-hidden="true" />
                    {scriptResult.readingTime} min read
                  </span>
                )}
                {(selectedFormat || scriptResult.contentType) && (
                  <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">
                    {selectedFormat?.label || scriptResult.contentType}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center py-20 text-center" role="status" aria-live="polite">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                    <Loader2 size={25} className="animate-spin" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-white">{loadingMessages[loadingMessageIndex]}</p>
                  <p className="mt-2 text-sm text-slate-500">Give us a moment to get the words just right.</p>
                  <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-400" />
                  </div>
                </div>
              ) : scriptResult ? (
                <article className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-200 sm:text-[15px] sm:leading-8">
                    {scriptResult.script}
                  </pre>
                </article>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 text-slate-500">
                    <FileText size={23} aria-hidden="true" />
                  </div>
                  <h3 className="font-medium text-slate-200">A blank page, full of possibility.</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Fill in your brief and generate a clear, natural-sounding script tailored to your format.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
        <footer className="py-7 text-center text-xs text-slate-600">
          HUMAN SCRIPT SYSTEM <span className="px-1.5">·</span> Make something meaningful.
        </footer>
      </div>
    </main>
  )
}

export default App
