import { buttonVariants } from "./button";
import { cva } from "class-variance-authority";

// Extended button variants for the logistics platform
export const customButtonVariants = cva(
  buttonVariants({ variant: "default" }),
  {
    variants: {
      variant: {
        hero: "bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
        success: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md",
        warning: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md",
        finance: "bg-gradient-secondary text-secondary-foreground shadow-lg hover:shadow-xl transition-smooth",
      },
    },
  }
);
