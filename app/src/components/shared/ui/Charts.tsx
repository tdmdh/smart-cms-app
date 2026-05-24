"use client"

import { cn } from "@/src/lib/utils"
import * as React from "react"
import * as RechartsPrimitive from "recharts"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn("chart-container", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                .map(([key, itemConfig]) => {
                  const color =
                    itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
                    itemConfig.color
                  return color ? `  --color-${key}: ${color};` : null
                })
                .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipPayloadItem {
  value?: number | string
  name?: string
  dataKey?: string | number
  type?: string
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode
  labelClassName?: string
  formatter?: (value: number | string, name: string, item: TooltipPayloadItem, index: number, payload: Record<string, unknown>) => React.ReactNode
  metadataFormatter?: (payload: Record<string, unknown>) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  metadataFormatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("chart-tooltip__label", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("chart-tooltip__label", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div className={cn("chart-tooltip", className)}>
      {!nestLabel ? tooltipLabel : null}
      <div className="chart-tooltip__items">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || (item.payload?.fill as string) || item.color

            return (
              <div
                key={`${item.dataKey}-${index}`}
                className={cn(
                  "chart-tooltip__item",
                  indicator === "dot" && "chart-tooltip__item--dot"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload || {})
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "chart-tooltip__indicator",
                            indicator === "dot" && "chart-tooltip__indicator--dot",
                            indicator === "line" && "chart-tooltip__indicator--line",
                            indicator === "dashed" && "chart-tooltip__indicator--dashed"
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                              backgroundColor: indicator !== "dashed" ? indicatorColor : undefined,
                              borderColor: indicator === "dashed" ? indicatorColor : undefined,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "chart-tooltip__content",
                        nestLabel ? "chart-tooltip__content--nested" : "chart-tooltip__content--inline"
                      )}
                    >
                      <div className="chart-tooltip__content-inner">
                        {nestLabel ? tooltipLabel : null}
                        <span className="chart-tooltip__name">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="chart-tooltip__value">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
      {metadataFormatter && payload?.[0]?.payload && (
        <div className="chart-tooltip__metadata">
          {metadataFormatter(payload[0].payload)}
        </div>
      )}
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

interface LegendPayloadItem {
  value?: string
  type?: string
  id?: string
  color?: string
  dataKey?: string | number
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean
  nameKey?: string
  payload?: LegendPayloadItem[]
  verticalAlign?: "top" | "bottom" | "middle"
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "chart-legend",
        verticalAlign === "top" ? "chart-legend--top" : "chart-legend--bottom",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className="chart-legend__item"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="chart-legend__indicator"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
      typeof payload.payload === "object" &&
      payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// --------------------------------------------------------------------------
// Chart Wrapper Components - Reusable layout containers
// --------------------------------------------------------------------------

interface ChartWrapperProps extends React.ComponentProps<"div"> {
  isLoading?: boolean
  isEmpty?: boolean
  emptyIcon?: React.ReactNode
  emptyMessage?: string
}

function ChartWrapper({
  className,
  children,
  isLoading,
  isEmpty,
  emptyIcon,
  emptyMessage = "No data available",
  ...props
}: ChartWrapperProps) {
  if (isLoading) {
    return (
      <div className={cn("chart-wrapper chart-wrapper--loading", className)} {...props}>
        <div className="chart-wrapper__skeleton" />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={cn("chart-wrapper chart-wrapper--empty", className)} {...props}>
        {emptyIcon}
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("chart-wrapper", className)} {...props}>
      {children}
    </div>
  )
}

interface ChartHeaderProps extends React.ComponentProps<"div"> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

function ChartHeader({ title, subtitle, icon, className, children, ...props }: ChartHeaderProps) {
  return (
    <div className={cn("chart-wrapper__header", className)} {...props}>
      <div className="chart-wrapper__title">
        {icon}
        <h4>{title}</h4>
        {subtitle && <p className="chart-wrapper__subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

interface ChartStatProps {
  value: string | number
  label: string
}

interface ChartStatsProps extends React.ComponentProps<"div"> {
  stats: ChartStatProps[]
}

function ChartStats({ stats, className, ...props }: ChartStatsProps) {
  return (
    <div className={cn("chart-wrapper__stats", className)} {...props}>
      {stats.map((stat, index) => (
        <div key={index} className="chart-wrapper__stat">
          <span className="chart-wrapper__stat-value">{stat.value}</span>
          <span className="chart-wrapper__stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

function ChartBody({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("chart-wrapper__chart", className)} {...props}>
      {children}
    </div>
  )
}

function ChartBodyScrollable({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("chart-wrapper__chart-container", className)} {...props}>
      {children}
    </div>
  )
}

type LegendVariant = "dot" | "bar"
type LegendColor = "success" | "info" | "warning" | "error" | string

interface LegendItem {
  label: string
  color?: LegendColor
  style?: React.CSSProperties
}

interface ChartLegendItemsProps extends React.ComponentProps<"div"> {
  items: LegendItem[]
  variant?: LegendVariant
}

function ChartLegendItems({ items, variant = "dot", className, ...props }: ChartLegendItemsProps) {
  return (
    <div className={cn("chart-wrapper__legend", className)} {...props}>
      {items.map((item, index) => {
        const isSemanticColor = ["success", "info", "warning", "error"].includes(item.color || "")
        const indicatorClass = variant === "dot"
          ? `chart-wrapper__legend-dot${isSemanticColor ? ` chart-wrapper__legend-dot--${item.color}` : ""}`
          : "chart-wrapper__legend-bar"

        const indicatorStyle = !isSemanticColor && item.color
          ? { background: item.color, ...item.style }
          : item.style

        return (
          <span key={index} className="chart-wrapper__legend-item">
            <span className={indicatorClass} style={indicatorStyle} />
            {item.label}
          </span>
        )
      })}
    </div>
  )
}

export {
  // Core Recharts wrappers
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  // Layout wrapper components
  ChartWrapper,
  ChartHeader,
  ChartStats,
  ChartBody,
  ChartBodyScrollable,
  ChartLegendItems,
}

