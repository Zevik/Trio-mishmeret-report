import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { he } from "date-fns/locale";

interface DatePickerStyledProps {
  value: string;       // Format: "YYYY-MM-DD" (ISO format)
  onChange: (date: string) => void;
  label: string;
  className?: string;
}

export default function DatePickerStyled({ value, onChange, label, className }: DatePickerStyledProps) {
  // State to hold the date object
  const [date, setDate] = useState<Date | undefined>(
    value ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  );

  // Update the date state when the value prop changes
  useEffect(() => {
    if (value) {
      setDate(parse(value, "yyyy-MM-dd", new Date()));
    } else {
      setDate(undefined);
    }
  }, [value]);

  // Handle date change from the calendar
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      // Convert the Date object to YYYY-MM-DD format for the onChange callback
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedDate);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="text-right mb-1">
        <label className="font-medium">{label} <span className="text-error">*</span></label>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-10 bg-white border border-neutral-medium justify-between text-right font-normal",
              !date && "text-neutral-medium"
            )}
          >
            {date ? (
              <span className="font-medium">
                {format(date, "dd/MM/yyyy", { locale: he })}
              </span>
            ) : (
              <span>בחר תאריך</span>
            )}
            <CalendarIcon className="h-5 w-5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            locale={he}
            className="rounded-md bg-white"
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              nav_button: "hover:bg-primary/10",
              table: "w-full border-collapse space-y-1",
              head_cell: "text-primary font-medium text-sm w-9 p-0 text-center",
              cell: "h-9 w-9 text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
              caption: "flex justify-center py-2 mb-4 relative items-center"
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}