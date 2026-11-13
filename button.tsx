import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-blue text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_20px_-8px_rgba(11,99,160,.7)] hover:bg-blue-ink",
        ink: "bg-ink text-white hover:bg-[#1f3150]",
        outline: "border-2 border-grout bg-surface text-ink hover:border-ink-2",
        ghost: "text-ink hover:bg-surface",
        danger: "border-2 border-grout bg-surface text-danger hover:border-danger",
        light: "bg-white text-ink hover:bg-tile",
      },
      size: {
        sm: "h-10 px-4 text-[0.9375rem]",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-7 text-[1.0625rem]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
