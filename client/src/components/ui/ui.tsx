import * as React from "react"
import { cn } from "@/lib/utils"

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  p?: number;
  pt?: number;
  pb?: number;
  pl?: number;
  pr?: number;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, mt, mb, ml, mr, p, pt, pb, pl, pr, style = {}, ...props }, ref) => {
    const styles: React.CSSProperties = {
      ...style,
      marginTop: mt !== undefined ? `${mt * 0.25}rem` : undefined,
      marginBottom: mb !== undefined ? `${mb * 0.25}rem` : undefined,
      marginLeft: ml !== undefined ? `${ml * 0.25}rem` : undefined,
      marginRight: mr !== undefined ? `${mr * 0.25}rem` : undefined,
      padding: p !== undefined ? `${p * 0.25}rem` : undefined,
      paddingTop: pt !== undefined ? `${pt * 0.25}rem` : undefined,
      paddingBottom: pb !== undefined ? `${pb * 0.25}rem` : undefined,
      paddingLeft: pl !== undefined ? `${pl * 0.25}rem` : undefined,
      paddingRight: pr !== undefined ? `${pr * 0.25}rem` : undefined,
    }

    return (
      <div
        ref={ref}
        className={cn(className)}
        style={styles}
        {...props}
      />
    )
  }
)

Box.displayName = "Box"

interface TypographyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "caption" | "overline";
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

const Typography = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, variant = "body1", color = "primary", ...props }, ref) => {
    const Component = 
      variant === "h1" ? "h1" :
      variant === "h2" ? "h2" :
      variant === "h3" ? "h3" :
      variant === "h4" ? "h4" :
      variant === "h5" ? "h5" :
      variant === "h6" ? "h6" :
      "p";

    const colorClasses = {
      primary: "text-primary",
      secondary: "text-secondary",
      error: "text-red-500",
      warning: "text-amber-500",
      info: "text-blue-500",
      success: "text-green-500",
    }

    const variantClasses = {
      h1: "text-4xl font-bold",
      h2: "text-3xl font-bold",
      h3: "text-2xl font-bold",
      h4: "text-xl font-bold",
      h5: "text-lg font-bold",
      h6: "text-base font-bold",
      subtitle1: "text-lg",
      subtitle2: "text-base font-medium",
      body1: "text-base",
      body2: "text-sm",
      caption: "text-xs",
      overline: "text-xs uppercase tracking-wider",
    }

    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          colorClasses[color],
          className
        )}
        {...props}
      />
    )
  }
)

Typography.displayName = "Typography"

export { Box, Typography } 