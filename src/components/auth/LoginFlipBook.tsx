import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

type FlipBookHandle = {
  pageFlip: () => {
    flipNext: (corner?: 'top' | 'bottom') => void
    flipPrev: (corner?: 'top' | 'bottom') => void
    turnToPage: (page: number) => void
    getPageCount: () => number
    getCurrentPageIndex: () => number
  }
} | null

interface BookPageProps {
  pageNumber: string
  eyebrow: string
  title: string
  body: string
  tone?: 'cover' | 'light' | 'accent'
}

const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage(
  { pageNumber, eyebrow, title, body, tone = 'light' },
  ref
) {
  const toneClass =
    tone === 'cover'
      ? 'bg-[linear-gradient(145deg,#0f172a,#1e293b_55%,#334155)] text-white border-slate-700'
      : tone === 'accent'
        ? 'bg-[linear-gradient(160deg,#f8fafc,#f1f5f9_55%,#e2e8f0)] text-slate-900 border-slate-200'
        : 'bg-[linear-gradient(160deg,#fffef8,#fafaf9_60%,#f5f5f4)] text-slate-800 border-stone-200'

  return (
    <div ref={ref} className={`h-full w-full rounded-2xl border ${toneClass} overflow-hidden`}>
      <div className="flex h-full flex-col justify-between p-7">
        <div>
          <p className={`text-[11px] uppercase tracking-[0.28em] ${tone === 'cover' ? 'text-slate-300' : 'text-slate-400'}`}>
            {eyebrow}
          </p>
          <h3
            className={`mt-5 text-3xl leading-tight ${
              tone === 'cover' ? 'font-semibold text-white' : 'font-light text-inherit'
            }`}
            style={tone === 'cover' ? { fontFamily: '"Playfair Display", "Georgia", serif' } : undefined}
          >
            {title}
          </h3>
          <p className={`mt-6 text-[15px] leading-7 ${tone === 'cover' ? 'text-slate-200' : 'text-slate-600'}`}>
            {body}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className={`h-px flex-1 ${tone === 'cover' ? 'bg-white/20' : 'bg-slate-200'}`}></div>
          <span className={`ml-4 text-xs tracking-[0.24em] ${tone === 'cover' ? 'text-slate-300' : 'text-slate-400'}`}>
            {pageNumber}
          </span>
        </div>
      </div>
    </div>
  )
})

function LoginFlipBook(): JSX.Element {
  const bookRef = useRef<FlipBookHandle>(null)
  const resetTimerRef = useRef<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const pages = useMemo(
    () => [
      {
        pageNumber: 'COVER',
        eyebrow: 'Anagnosis',
        title: 'Open the quietest part of your library.',
        body: 'A calmer reading entrance, with room for AI notes, collected passages, and the pace of a real book.',
        tone: 'cover' as const,
      },
      {
        pageNumber: '01',
        eyebrow: 'Read',
        title: 'Import EPUB and TXT into a personal shelf.',
        body: 'Bring your books in, organize them locally, and keep your reading flow focused on the text instead of the tool.',
        tone: 'light' as const,
      },
      {
        pageNumber: '02',
        eyebrow: 'Think',
        title: 'Turn difficult passages into useful notes.',
        body: 'Select language, ask for explanation, and keep what matters. The reading session slowly becomes a living notebook.',
        tone: 'accent' as const,
      },
      {
        pageNumber: '03',
        eyebrow: 'Return',
        title: 'Come back to highlights that still remember context.',
        body: 'Not just snippets, but a trail through the book: where you paused, what you marked, and what you wanted to understand.',
        tone: 'light' as const,
      },
      {
        pageNumber: 'BACK',
        eyebrow: 'Begin',
        title: 'Enter with an invite code and start reading.',
        body: 'The first page is a threshold. The rest is your reading ritual.',
        tone: 'cover' as const,
      },
    ],
    []
  )

  useEffect(() => {
    if (!isReady) {
      return
    }

    const timer = window.setInterval(() => {
      const api = bookRef.current?.pageFlip()
      if (!api) {
        return
      }

      const total = api.getPageCount()
      const index = api.getCurrentPageIndex()

      if (index >= total - 1) {
        if (resetTimerRef.current !== null) {
          return
        }

        resetTimerRef.current = window.setTimeout(() => {
          const resetApi = bookRef.current?.pageFlip()
          if (!resetApi) {
            resetTimerRef.current = null
            return
          }

          resetApi.turnToPage(0)
          setCurrentPage(0)
          resetTimerRef.current = null
        }, 1600)
        return
      }

      api.flipNext('bottom')
    }, 5200)

    return () => {
      window.clearInterval(timer)
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [isReady])

  return (
    <div className="relative w-full max-w-[650px] animate-gentle-float">
      <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-stone-100/90 via-white to-slate-100/90 shadow-[0_40px_100px_rgba(15,23,42,0.12)]"></div>
      <div className="absolute inset-[7%] rounded-[32px] bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_rgba(226,232,240,0.18)_42%,_transparent_70%)]"></div>

      <div className="relative rounded-[40px] px-8 pb-8 pt-10">
        <div className="login-flipbook mx-auto max-w-[540px]">
          <HTMLFlipBook
            ref={bookRef}
            width={320}
            height={430}
            style={{}}
            minWidth={280}
            maxWidth={420}
            minHeight={360}
            maxHeight={520}
            size="stretch"
            startPage={0}
            showCover
            showPageCorners
            disableFlipByClick={false}
            usePortrait
            drawShadow
            maxShadowOpacity={0.32}
            flippingTime={1500}
            mobileScrollSupport={false}
            onInit={() => setIsReady(true)}
            onFlip={(event) => setCurrentPage(Number(event.data))}
            className="mx-auto"
            startZIndex={5}
            autoSize
            clickEventForward
            useMouseEvents
            swipeDistance={24}
          >
            {pages.map((page) => (
              <BookPage key={page.pageNumber} {...page} />
            ))}
          </HTMLFlipBook>
        </div>

        <div className="mt-6 flex items-center justify-between px-6 text-xs uppercase tracking-[0.22em] text-slate-400">
          <span>Flip Through</span>
          <span>{String(currentPage + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[8%] left-[8%] max-w-[240px] rounded-[24px] border border-white/70 bg-white/78 px-5 py-4 backdrop-blur-md shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">Reading Ritual</p>
        <p className="text-lg font-light leading-7 text-slate-800">
          A real book motion works better here than a faked page silhouette.
        </p>
      </div>
    </div>
  )
}

export default LoginFlipBook
