import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "glow" | "gradient";
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => {
  const variants = {
    default: "bg-white border shadow-sm",
    glass: "bg-white/5 backdrop-blur-md border border-white/10",
    glow: "bg-white/5 backdrop-blur-md border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)]",
    gradient:
      "bg-gradient-to-b from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.2)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl transition-all duration-300",
        variants[variant],
        hover &&
          "hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] cursor-pointer",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-8 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold text-white leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-8 pt-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-8 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { color?: "blue" | "purple" | "green" }
>(({ className, color = "blue", ...props }, ref) => {
  const colors = {
    blue: "bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]",
    purple: "bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]",
    green: "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm rounded-full font-medium",
        colors[color],
        className
      )}
      {...props}
    />
  );
});
CardBadge.displayName = "CardBadge";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardBadge,
};