import { Button } from './Button';
import { InlineAlert } from './InlineAlert';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'destructive';
  isLoading?: boolean;
  error?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'انصراف',
  tone = 'default',
  isLoading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      preventClose={isLoading}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
    </Modal>
  );
}
