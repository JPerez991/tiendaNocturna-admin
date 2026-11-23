import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

/**
 * Diálogo nativo: <dialog> da foco atrapado, Escape y cierre accesible.
 * Se usa solo cuando la tarea merece interrumpir (detalle de una pregunta),
 * no como contenedor genérico de formularios.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // El backdrop es el propio <dialog>; el contenido va en un div interior.
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={`m-auto max-h-[88vh] w-[calc(100vw-2rem)] overflow-y-auto border border-tinta/15 bg-crema p-0 text-carbon ${
        size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
      }`}
    >
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-tinta/10 pb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold text-carbon">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-tibio">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center text-tibio transition-colors hover:bg-tinta/5 hover:text-tinta"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
