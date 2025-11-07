import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            // Base responsive styles
            "text-sm md:text-base",
            "px-2 py-1.5 md:px-3 md:py-2",
            "rounded-md",
            "transition-colors",
            "block w-full md:w-auto",
            "text-center md:text-left",
            // User-provided className
            className,
            // Active state
            isActive && activeClassName,
            // Pending state
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
