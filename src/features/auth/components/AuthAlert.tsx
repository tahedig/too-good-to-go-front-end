type AuthAlertProps = {
  children: string
  tone?: 'error' | 'success'
}

export default function AuthAlert({ children, tone = 'error' }: AuthAlertProps) {
  const isError = tone === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg px-4 py-4 text-body-md ${
        isError ? 'bg-error-subtle text-text-primary' : 'bg-success-subtle text-success'
      }`}
    >
      <svg className="mt-0.5 size-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        {isError ? (
          <>
            <path d="M12 7.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" />
          </>
        ) : (
          <path
            d="m8 12.2 2.6 2.6L16.5 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <p>{children}</p>
    </div>
  )
}
