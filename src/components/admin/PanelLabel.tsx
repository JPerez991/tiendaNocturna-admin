/**
 * Etiqueta funcional del panel. Sustituye al wordmark de la tienda: aquí no
 * hay escaparate, solo una identificación discreta de la herramienta.
 */
export function PanelLabel({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      Admin · Nocturna
    </p>
  );
}
