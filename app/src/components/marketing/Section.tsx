import type { HTMLAttributes, ReactNode } from "react";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  withGradient?: boolean;
}

export function Section({ children, withGradient = false, className = "", ...props }: SectionProps) {
  return (
    <section 
      className={`page-home__section ${withGradient ? 'page-home__section--with-gradient' : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
