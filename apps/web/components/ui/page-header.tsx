import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 md:mb-8', className)}>
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-white/45 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  )
}
