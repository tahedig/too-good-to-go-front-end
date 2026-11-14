const linkVariants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  secondary:
    'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-subtle active:bg-surface-sage',
  outline: 'border border-border-default bg-surface text-text-primary hover:bg-surface-secondary',
}

/** Styles a router Link like the design-system Button (navigation should stay a link). */
export function linkButtonClass(variant: keyof typeof linkVariants, extra = '') {
  return [
    'inline-flex h-12 items-center justify-center rounded-md px-5 text-label-md whitespace-nowrap transition-colors',
    'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus',
    linkVariants[variant],
    extra,
  ].join(' ')
}
