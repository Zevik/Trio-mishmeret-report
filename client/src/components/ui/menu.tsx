import * as React from "react"
import { cn } from "@/lib/utils"

export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent hover:bg-accent",
          className
        )}
        {...props}
      />
    )
  }
)

MenuItem.displayName = "MenuItem"

export { MenuItem } 