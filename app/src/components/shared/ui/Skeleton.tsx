import { cn } from "@/src/lib/utils"


function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gray-900 animate-pulse rounded-4xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
