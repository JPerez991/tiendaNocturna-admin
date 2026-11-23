import type { ReactNode } from "react";

/**
 * Bloque de un formulario largo. Separa con hairlines y aire, sin cajas
 * anidadas: la tarjeta blanca es el único marco de la sección.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-tinta/10 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-tinta/10 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-carbon">{title}</h3>
          {description && <p className="mt-1 text-sm text-tibio">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
