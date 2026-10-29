import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { CloseIcon } from './icons';

export type ModalVariant = 'dialog' | 'sheet';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: ModalVariant;
  headerAction?: ReactNode;
  preventClose?: boolean;
  closeOnOverlayClick?: boolean;
  hideCloseButton?: boolean;
  closeLabel?: string;
  className?: string;
}

let lockCount = 0;
let previousOverflow = '';

function lockBodyScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
  return () => {
    lockCount -= 1;
    if (lockCount === 0) document.body.style.overflow = previousOverflow;
  };
}

const surfaceStyles =
  'border-0 bg-surface p-0 text-text-primary shadow-[0_16px_48px_rgb(38_61_50/0.24)] overscroll-contain ' +
  'open:flex open:flex-col ' +
  'opacity-0 open:opacity-100 starting:open:opacity-0 ' +
  'transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out motion-reduce:transition-none ' +
  'backdrop:bg-primary/40 backdrop:backdrop-blur-[2px] backdrop:opacity-0 open:backdrop:opacity-100 ' +
  'starting:open:backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete ' +
  'backdrop:duration-200 motion-reduce:backdrop:transition-none';

const variantStyles: Record<ModalVariant, string> = {
  dialog:
    'm-auto w-[calc(100%-2rem)] max-w-100 max-h-[calc(100dvh-2rem)] rounded-xl ' +
    'translate-y-4 open:translate-y-0 starting:open:translate-y-4',
  sheet:
    'mx-0 mb-0 mt-auto w-full max-w-none max-h-[90dvh] rounded-t-xl ' +
    'translate-y-full open:translate-y-0 starting:open:translate-y-full',
};


export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  headerAction,
  preventClose = false,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  closeLabel = 'بستن',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  function requestClose() {
    if (!preventClose) onClose();
  }

  function handleMouseDown(e: MouseEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = e.target === e.currentTarget;
  }

  function handleClick(e: MouseEvent<HTMLDialogElement>) {
    if (closeOnOverlayClick && e.target === e.currentTarget && pressStartedOnBackdrop.current) {
      requestClose();
    }
  }

  const gap = variant === 'sheet' ? 'gap-6' : 'gap-5';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={[surfaceStyles, variantStyles[variant], className].filter(Boolean).join(' ')}
    >
      <div className={['flex min-h-0 flex-1 flex-col p-6', gap].join(' ')}>
        {variant === 'sheet' && <div aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-text-secondary" />}

        <header className="flex shrink-0 items-center gap-3">
          <h2 id={titleId} className="min-w-0 flex-1 text-title-lg text-text-primary">
            {title}
          </h2>

          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={requestClose}
                disabled={preventClose}
                aria-label={closeLabel}
                className={
                  'grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary ' +
                  'transition-colors hover:bg-surface-secondary active:bg-surface-sage ' +
                  'disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-disabled'
                }
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </header>

        <div className={['-m-1 flex min-h-0 flex-1 flex-col overflow-y-auto p-1', gap].join(' ')}>
          {description && (
            <p id={descriptionId} className="text-body-lg text-text-primary">
              {description}
            </p>
          )}
          {children}
        </div>

        {footer && <footer className="flex shrink-0 flex-col gap-5">{footer}</footer>}
      </div>
    </dialog>
  );
}
