import { Modal, Typography } from "@mui/material";

interface ActionButton {
  label: string;
  onClick: () => void;
  className?: string; // classes do Tailwind
}

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions?: ActionButton[];
}

export default function CustomModal({
  open,
  onClose,
  title,
  description,
  actions = [],
}: CustomModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
          <Typography variant="h6" component="h2" className="font-bold text-gray-900">
            {title}
          </Typography>

          {description && (
            <Typography className="mt-2 text-gray-600">{description}</Typography>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action.className || "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
