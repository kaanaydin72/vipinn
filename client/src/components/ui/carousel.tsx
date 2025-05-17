import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CarouselProps = {
  options?: Parameters<typeof useEmblaCarousel>[0]
  className?: string
  children: React.ReactNode
  showDots?: boolean
}

type DotButtonProps = {
  selected: boolean
  onClick: () => void
}

const DotButton: React.FC<DotButtonProps> = ({ selected, onClick }) => {
  return (
    <button
      className={cn(
        'w-3 h-3 rounded-full mx-1 transition-all',
        selected ? 'bg-primary scale-110' : 'bg-neutral-300 dark:bg-neutral-600'
      )}
      type="button"
      onClick={onClick}
    />
  )
}

export function Carousel({ options, className, children, showDots = true }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onSelect(emblaApi)
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">{children}</div>
      </div>
      
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
        <Button 
          onClick={scrollPrev} 
          disabled={!prevBtnEnabled}
          size="icon"
          variant="secondary"
          className={cn(
            'rounded-full shadow-lg bg-white/80 hover:bg-white text-neutral-800 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 dark:text-white pointer-events-auto',
            !prevBtnEnabled && 'opacity-50 pointer-events-none'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={scrollNext} 
          disabled={!nextBtnEnabled}
          size="icon"
          variant="secondary"
          className={cn(
            'rounded-full shadow-lg bg-white/80 hover:bg-white text-neutral-800 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 dark:text-white pointer-events-auto',
            !nextBtnEnabled && 'opacity-50 pointer-events-none'
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {showDots && scrollSnaps.length > 1 && (
        <div className="flex justify-center mt-4 gap-1">
          {scrollSnaps.map((_, idx) => (
            <DotButton
              key={idx}
              selected={idx === selectedIndex}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CarouselItem: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={cn('flex-[0_0_100%] min-w-0', className)}>
      {children}
    </div>
  )
}