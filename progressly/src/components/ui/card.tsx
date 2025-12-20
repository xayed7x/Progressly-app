import * as React from "react";
import { cn } from "@/lib/utils";

// ===== PREVIOUS VERSION (for revert) =====
// The original Card was a simple component with:
// - className: "rounded-lg border bg-card text-card-foreground shadow-sm"
// - No variants, no hover effects, no gradients
// ==========================================

// Card variants based on design-inspiration.md
const cardVariants = {
  default:
    "bg-[#1A1A1C] border border-white/10 shadow-md backdrop-blur-sm",
  gradient: "border-0 shadow-md",
  elevated:
    "bg-[#1A1A1C] border border-white/10 shadow-lg hover:shadow-xl",
  flat: "bg-[#1A1A1C] border border-white/10 shadow-none",
} as const;

// Gradient options
const gradientVariants = {
  mint: "bg-gradient-mint",
  purple: "bg-gradient-purple",
  warm: "bg-gradient-warm",
  cool: "bg-gradient-cool",
  pink: "bg-gradient-pink",
  blue: "bg-gradient-blue",
  red: "bg-gradient-red",
} as const;

// Padding options
const paddingVariants = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
} as const;

type CardVariant = keyof typeof cardVariants;
type GradientVariant = keyof typeof gradientVariants;
type PaddingVariant = keyof typeof paddingVariants;

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  gradient?: GradientVariant;
  padding?: PaddingVariant;
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant = "default",
      gradient,
      padding,
      hoverable = false,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        "rounded-lg text-white/90 transition-all duration-200",
        // Variant styles
        cardVariants[variant],
        // Gradient (only applies if variant is 'gradient')
        variant === "gradient" && gradient && gradientVariants[gradient],
        // Padding override
        padding && paddingVariants[padding],
        // Hover effect
        hoverable && "hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20 cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[20px] font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

export type { EnhancedCardProps, CardVariant, GradientVariant, PaddingVariant };
