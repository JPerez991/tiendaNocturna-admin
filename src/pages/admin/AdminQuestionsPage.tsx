import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { AdminQuestion, QuestionFilter, QuestionHistoryEntry } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Textarea } from "../../components/ui/Field";
import { ErrorState, Spinner } from "../../components/ui/States";
import { HistoryIcon, SendIcon, TrashIcon } from "../../components/ui/Icons";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/admin/PageHeader";

/* ============================================================
   Admin › Preguntas — responder, corregir y auditar dudas.
   Contrato (§8): GET list + PATCH respuesta. Filtros, borrado
   lógico e historial están pedidos en la nota 20; si el backend
   aún no los tiene, la UI lo dice en vez de romperse.
   ============================================================ */

const FILTROS: Array<{ value: QuestionFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "ANSWERED", label: "Respondidas" },
  { value: "DELETED", label: "Eliminadas" },
];

function estado(q: AdminQuestion): Exclude<QuestionFilter, "ALL"> {
  if (q.status === "DELETED" || q.deletedAt) return "DELETED";
  if (q.status === "ANSWERED" || q.answer) return "ANSWERED";
  return "PENDING";
}

function etiquetaEstado(q: AdminQuestion) {
  const e = estado(q);
  if (e === "DELETED") return { texto: "Eliminada", tono: "danger" as const };
  if (e === "ANSWERED") return { texto: "Respondida", tono: "success" as const };
  return { texto: "Pendiente", tono: "warning" as const };
}

function fecha(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(d);
}

export function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noDisponible, setNoDisponible] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filtro, setFiltro] = useState<QuestionFilter>("ALL");
  const [busqueda, setBusqueda] = useState("");

  const [seleccionada, setSeleccionada] = useState<AdminQuestion | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [historial, setHistorial] = useState<QuestionHistoryEntry[] | null>(null);
  const [historialNoDisponible, setHistorialNoDisponible] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.admin
      .questions(filtro)
      .then((r) => {
        if (cancelled) return;
        // El backend puede ignorar ?status= (nota 20): filtramos también aquí.
        setQuestions(filtro === "ALL" ? r : r.filter((q) => estado(q) === filtro));
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.statusCode === 404) {
          setNoDisponible(true);
          setQuestions([]);
        } else {
          setError(e instanceof Error ? e.message : "Error desconocido");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filtro, reloadKey]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q || !questions) return questions ?? [];
    return questions.filter((item) =>
      [
        item.product.name,
        item.question,
        item.answer ?? "",
        item.user?.firstName ?? "",
        item.email ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [busqueda, questions]);

  const pendientes = questions?.filter((q) => estado(q) === "PENDING").length ?? 0;

  function recargar() {
    setError(null);
    setReloadKey((k) => k + 1);
  }

  function abrir(q: AdminQuestion) {
    setSeleccionada(q);
    setRespuesta(q.answer ?? "");
    setConfirmando(false);
    setHistorial(null);
    setHistorialNoDisponible(false);
    setMsg(null);
  }

  function cerrar() {
    setSeleccionada(null);
    setConfirmando(false);
  }

  async function enviarRespuesta() {
    if (!seleccionada || !respuesta.trim()) return;
    setGuardando(true);
    setMsg(null);
    try {
      await api.admin.answerQuestion(seleccionada.id, respuesta.trim());
      setMsg({ texto: "Respuesta enviada.", ok: true });
      cerrar();
      recargar();
    } catch (e) {
      setMsg({
        texto: e instanceof ApiError ? e.message : "No pudimos enviar la respuesta.",
        ok: false,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!seleccionada) return;
    setBorrando(true);
    setMsg(null);
    try {
      await api.admin.deleteQuestion(seleccionada.id);
      setMsg({ texto: "Pregunta eliminada de la tienda.", ok: true });
      cerrar();
      recargar();
    } catch (e) {
      setMsg({
        texto:
          e instanceof ApiError && e.statusCode === 404
            ? "El borrado lógico aún no está disponible en la API (nota 20)."
            : "No pudimos eliminar la pregunta.",
        ok: false,
      });
      setConfirmando(false);
    } finally {
      setBorrando(false);
    }
  }

  async function cargarHistorial() {
    if (!seleccionada || historial !== null) return;
    setMsg(null);
    try {
      setHistorial(await api.admin.questionHistory(seleccionada.id));
    } catch (e) {
      setHistorial([]);
      if (e instanceof ApiError && e.statusCode === 404) setHistorialNoDisponible(true);
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Preguntas" />
        <ErrorState message={error} onRetry={recargar} />
      </>
    );
  }

  if (questions === null) {
    return (
      <>
        <PageHeader title="Preguntas" />
        <Spinner label="Cargando preguntas…" />
      </>
    );
  }

  const eliminada = seleccionada ? estado(seleccionada) === "DELETED" : false;

  return (
    <>
      <PageHeader
        title="Preguntas"
        meta={
          noDisponible
            ? "Módulo pendiente en la API"
            : `${questions.length} en total · ${pendientes} por responder`
        }
      />

      {noDisponible && (
        <p className="mb-5 bg-acento-fondo px-4 py-3 text-sm text-vino">
          El listado de preguntas aún no está disponible en la API
          (GET /api/admin/questions). Esta pantalla empezará a funcionar en cuanto
          el backend lo implemente; no hay que cambiar código.
        </p>
      )}

      {msg && (
        <p
          role="status"
          className={`mb-4 px-4 py-3 text-sm ${
            msg.ok ? "bg-tinta/10 text-tinta" : "bg-vino/10 text-vino"
          }`}
        >
          {msg.texto}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Filtrar preguntas" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filtro === f.value}
              onClick={() => setFiltro(f.value)}
              className={`min-h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                filtro === f.value
                  ? "bg-tinta text-crema"
                  : "bg-tinta/5 text-tibio hover:bg-tinta/10 hover:text-tinta"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input
          id="q-buscar"
          label="Buscar"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Producto o cliente…"
          className="w-full sm:w-72"
        />
      </div>

      {visibles.length === 0 ? (
        <p className="px-6 py-16 text-center text-tibio">
          {busqueda.trim()
            ? "No hay preguntas que coincidan con la búsqueda."
            : "No hay preguntas con este filtro."}
        </p>
      ) : (
        <>
          <div className="hidden border-b border-tinta/10 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-tibio lg:grid lg:grid-cols-[1.3fr_1fr_2fr_0.8fr_0.8fr] lg:gap-3">
            <span>Producto</span>
            <span>Cliente</span>
            <span>Pregunta</span>
            <span>Estado</span>
            <span>Fecha</span>
          </div>
          <ul className="space-y-2">
            {visibles.map((q) => {
              const e = etiquetaEstado(q);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => abrir(q)}
                    className="grid w-full gap-2 border border-tinta/10 bg-white p-4 text-left transition-colors hover:bg-nude/60 lg:grid-cols-[1.3fr_1fr_2fr_0.8fr_0.8fr] lg:items-center lg:gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-carbon">
                        {q.product.name}
                      </span>
                      <span className="block truncate text-xs text-tibio">/{q.product.slug}</span>
                    </span>
                    <span className="min-w-0 truncate text-sm text-carbon">
                      {q.user?.firstName ?? "Cliente"}
                    </span>
                    <span className="min-w-0 truncate text-sm text-tibio">{q.question}</span>
                    <span><Badge tone={e.tono}>{e.texto}</Badge></span>
                    <span className="tabular text-xs text-tibio">{fecha(q.createdAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Modal
        open={!!seleccionada}
        onClose={cerrar}
        title="Pregunta del cliente"
        description={seleccionada ? `Sobre ${seleccionada.product.name}` : undefined}
        size="lg"
      >
        {seleccionada && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge tone={etiquetaEstado(seleccionada).tono}>
                {etiquetaEstado(seleccionada).texto}
              </Badge>
              <span className="text-tibio">
                {seleccionada.user?.firstName ?? "Cliente"}
                {seleccionada.email && ` · ${seleccionada.email}`}
              </span>
              <span className="tabular text-xs text-tibio">
                {fecha(seleccionada.createdAt)}
              </span>
            </div>

            <blockquote className="border-l border-tinta/20 pl-4 text-carbon">
              {seleccionada.question}
            </blockquote>

            {eliminada && (
              <p className="bg-vino/10 px-4 py-3 text-sm text-vino">
                Eliminada {seleccionada.deletedBy ? `por ${seleccionada.deletedBy}` : ""}
                {seleccionada.deletedAt ? ` el ${fecha(seleccionada.deletedAt)}` : ""}.
                Ya no es visible en la tienda, pero se conserva para auditoría.
              </p>
            )}

            {seleccionada.answer && (
              <div className="bg-nude px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-tibio">
                  Respuesta
                  {seleccionada.answeredByName ? ` · ${seleccionada.answeredByName}` : ""}
                  {seleccionada.updatedAt ? " · editada" : ""}
                </p>
                <p className="text-sm text-carbon">{seleccionada.answer}</p>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => void cargarHistorial()}
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-tibio underline decoration-tinta/30 underline-offset-4 hover:text-tinta"
              >
                <HistoryIcon />
                Ver historial de ediciones
              </button>
              {historial !== null && (
                <div className="mt-2 bg-white p-4 text-sm">
                  {historialNoDisponible || historial.length === 0 ? (
                    <p className="text-tibio">
                      {historialNoDisponible
                        ? "El historial aún no está disponible en la API (nota 20)."
                        : "Sin versiones anteriores registradas."}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {historial.map((h, i) => (
                        <li key={i} className="border-b border-tinta/10 pb-2 last:border-0 last:pb-0">
                          <p className="text-xs font-semibold text-tibio">
                            {h.campo === "question" ? "Pregunta anterior" : "Respuesta anterior"}
                            {h.editadoEn ? ` · ${fecha(h.editadoEn)}` : ""}
                          </p>
                          <p className="mt-1 text-carbon">{h.textoAnterior}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {!eliminada && (
              <Textarea
                id={`resp-${seleccionada.id}`}
                label={seleccionada.answer ? "Corregir respuesta" : "Responder"}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                rows={4}
                hint="Escribe la respuesta que verá el cliente en la tienda."
              />
            )}

            <div className="border-t border-tinta/10 pt-4">
              {confirmando ? (
                <div role="status" className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-vino">
                    ¿Eliminar esta pregunta? El cliente ya no la verá.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="danger" loading={borrando} onClick={() => void eliminar()}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmando(true)}
                    className="text-vino hover:bg-vino/10"
                  >
                    <TrashIcon />
                    Eliminar
                  </Button>
                  {!eliminada && (
                    <Button
                      size="sm"
                      loading={guardando}
                      disabled={!respuesta.trim()}
                      onClick={() => void enviarRespuesta()}
                    >
                      <SendIcon />
                      {seleccionada.answer ? "Corregir respuesta" : "Enviar respuesta"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
