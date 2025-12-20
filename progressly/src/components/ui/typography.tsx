import * as React from "react";
import { cn } from "@/lib/utils";

// Typography variants based on design-inspiration.md
const typographyVariants = {
  hero: "text-[56px] leading-[1.2] font-bold",
  display: "text-[40px] leading-[1.2] font-bold",
  h1: "text-[32px] leading-[1.3] font-semibold",
  h2: "text-[24px] leading-[1.3] font-semibold",
  h3: "text-[20px] leading-[1.4] font-semibold",
  "body-lg": "text-[18px] leading-[1.5] font-normal",
  body: "text-[16px] leading-[1.5] font-normal",
  "body-sm": "text-[14px] leading-[1.5] font-normal",
  caption: "text-[12px] leading-[1.4] font-normal",
} as const;

const weightVariants = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

const colorVariants = {
  primary: "text-white/90",
  secondary: "text-white/70",
  muted: "text-white/60",
  accent: "text-accent1",
  error: "text-error",
  inherit: "",
} as const;

type TypographyVariant = keyof typeof typographyVariants;
type TypographyWeight = keyof typeof weightVariants;
type TypographyColor = keyof typeof colorVariants;

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  as?: React.ElementType;
  children: React.ReactNode;
}

// Map variants to semantic HTML elements
const variantElementMap: Record<TypographyVariant, React.ElementType> = {
  hero: "span",
  display: "span",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = "body",
      weight,
      color = "primary",
      as,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = as || variantElementMap[variant];

    return (
      <Component
        ref={ref}
        className={cn(
          typographyVariants[variant],
          weight && weightVariants[weight],
          colorVariants[color],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";

// Convenience component for bold numbers (common pattern in the app)
interface BoldNumberProps {
  value: number | string;
  unit?: string;
  size?: TypographyVariant;
  className?: string;
}

const BoldNumber: React.FC<BoldNumberProps> = ({
  value,
  unit,
  size = "body",
  className,
}) => {
  return (
    <span className={cn(typographyVariants[size], className)}>
      <span className="font-bold text-accent1">{value}</span>
      {unit && <span className="text-white/60 font-normal">{unit}</span>}
    </span>
  );
};

export { Typography, BoldNumber, typographyVariants };
export type { TypographyProps, TypographyVariant, TypographyWeight, TypographyColor };
