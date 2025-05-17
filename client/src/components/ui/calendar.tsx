import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col md:flex-row space-y-4 md:space-x-6 md:space-y-0",
        month: "space-y-4 bg-white dark:bg-neutral-900 border-2 border-[#2094f3] rounded-lg shadow-xl p-4 min-w-[300px] md:min-w-[320px] flex-shrink-0 overflow-visible",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-black dark:text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white dark:bg-neutral-800 p-0 opacity-80 hover:opacity-100 border border-primary/20 shadow-md"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#2094f3] font-semibold rounded-md w-10 text-sm",
        row: "flex w-full mt-2 gap-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-[#2094f3]/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#2094f3]/10 hover:text-black dark:hover:text-white"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#2094f3] text-white hover:bg-[#2094f3] hover:text-white focus:bg-[#2094f3] focus:text-white shadow-lg font-bold text-lg",
        day_today: "bg-[#2094f3]/40 text-[#2094f3] font-semibold shadow-lg text-base",
        day_outside:
          "day-outside text-neutral-400 aria-selected:bg-primary/5 aria-selected:text-neutral-500",
        day_disabled: "text-neutral-300 dark:text-neutral-600 opacity-50",
        day_range_middle:
          "aria-selected:bg-[#2094f3]/5 aria-selected:text-[#2094f3]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        DayContent: (props) => {
          const { date, displayMonth } = props;
          
          // Özel takvim durum bilgilerinin alınması - props'tan günlük fiyatları alalım
          // @ts-ignore - react-day-picker'daki DayContentProps'da eksik belirtim için
          const dayPricesArray = props.modifiers?.dayPrices as {date: Date, price: number}[] | undefined;
          
          if (dayPricesArray && dayPricesArray.length > 0) {
            const matchingPrice = dayPricesArray.find(dp => 
              dp.date.getDate() === date.getDate() && 
              dp.date.getMonth() === date.getMonth() && 
              dp.date.getFullYear() === date.getFullYear()
            );
            
            if (matchingPrice) {
              return (
                <div className="flex flex-col items-center justify-center p-0 w-full h-full">
                  <div className="text-xs font-semibold mb-1 text-[#2094f3]">{matchingPrice.price}₺</div>
                  <div>{date.getDate()}</div>
                </div>
              );
            }
          }
          
          return <div>{date.getDate()}</div>;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
