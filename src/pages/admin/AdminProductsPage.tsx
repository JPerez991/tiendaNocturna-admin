import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import { formatCOP } from "../../lib/format";
import type {
  Category,
  FichaTecnica,
  Product,
  ProductDetail,
  ProductInput,
} from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { ErrorState, Spinner } from "../../components/ui/States";
import { ImageIcon, PlusIcon, TrashIcon } from "../../components/ui/Icons";
import { PageHeader } from "../../components/admin/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { Toggle } from "../../components/ui/Toggle";

/* ============================================================
   Admin › Productos — lista + formulario por secciones.
   Contrato: POST/PATCH /api/admin/products (§6).
   Los campos marcados "nota 20" son opcionales y están pedidos al
   BACKEND en docs/api-contract.md; la UI los envía y degrada si el
   servidor los ignora.
   ============================================================ */

interface VariantForm {
  sku: string;
  talla: string;
  color: string;
  colorHex: string;
  price: string;
  stock: string;
  active: boolean;
}

interface ImageForm {
  url: string;
  alt: string;
  color: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  ofertaActiva: boolean;
  offerEndsAt: string;
  marca: string;
  material: string;
  genero: string;
  tipoArticulo: string;
  atributos: Record<string, string>;
  images: ImageForm[];
  variants: VariantForm[];
  active: boolean;
}

const TIPOS_ARTICULO = [
  { value: "sujetador", label: "Sujetador" },
  { value: "braga", label: "Braga / Culote" },
  { value: "body", label: "Body" },
  { value: "conjunto", label: "Conjunto" },
  { value: "babydoll", label: "Babydoll / Camisón" },
  { value: "media", label: "Media / Calcetín" },
  { value: "accesorio", label: "Accesorio" },
];

type CampoExtra = { key: string; label: string; opciones?: string[] };

/** Atributos editoriales de lencería: se activan según el tipo de artículo. */
const ATRIBUTOS_POR_TIPO: Record<string, CampoExtra[]> = {
  sujetador: [
    { key: "copa", label: "Copa", opciones: ["A", "B", "C", "D", "E", "F", "Sin copa"] },
    { key: "aro", label: "Aro", opciones: ["Con aro", "Sin aro"] },
    { key: "tirantes", label: "Tirantes", opciones: ["Fijos", "Ajustables", "Desmontables", "Cruzados"] },
    { key: "relleno", label: "Relleno", opciones: ["Ninguno", "Acolchado", "Push-up", "Media copa"] },
    { key: "cierre", label: "Cierre", opciones: ["Broche frontal", "Broche posterior", "Sin cierre"] },
  ],
  braga: [
    { key: "corte", label: "Corte", opciones: ["Clásica", "Hipster", "Tanga", "Thong", "High-waist", "Boyshort"] },
    { key: "cobertura", label: "Cobertura", opciones: ["Completa", "Media", "Mínima"] },
    { key: "forro", label: "Forro", opciones: ["Sin forro", "Algodón", "Encaje"] },
    { key: "detalle", label: "Detalle", opciones: ["Liso", "Encaje", "Transparencia", "Bordado"] },
  ],
  body: [
    { key: "escote", label: "Escote", opciones: ["Redondo", "V", "Halter", "Bandeau", "Off-shoulder"] },
    { key: "manga", label: "Manga", opciones: ["Sin manga", "Corta", "3/4", "Larga"] },
    { key: "cierre", label: "Cierre", opciones: ["Presión", "Cremallera", "Broches", "Sin cierre"] },
    { key: "forro", label: "Forro", opciones: ["Sin forro", "Forro completo", "Forro parcial"] },
  ],
  conjunto: [
    { key: "incluye", label: "Incluye", opciones: ["Sujetador y braga", "Top y braga", "Body y braga", "Babydoll y braga"] },
    { key: "copa", label: "Copa", opciones: ["A", "B", "C", "D", "E", "Sin copa"] },
    { key: "corte", label: "Corte de la braga", opciones: ["Clásica", "Hipster", "Tanga", "Thong"] },
    { key: "detalle", label: "Detalle", opciones: ["Encaje", "Microfibra", "Seda", "Bordado"] },
  ],
  babydoll: [
    { key: "largo", label: "Largo", opciones: ["Corto", "Mid-thigh", "Largo"] },
    { key: "transparencia", label: "Transparencia", opciones: ["Opaco", "Semitransparente", "Transparente"] },
    { key: "detalle", label: "Detalle", opciones: ["Encaje", "Plumón", "Lazo", "Bordado"] },
    { key: "incluye", label: "Incluye", opciones: ["Solo babydoll", "Con braga", "Con bata"] },
  ],
  media: [
    { key: "altura", label: "Altura", opciones: ["Pantyhose", "Medias altas", "Cortas", "Calcetín"] },
    { key: "denier", label: "Denier", opciones: ["10", "15", "20", "40", "60", "80"] },
    { key: "textura", label: "Textura", opciones: ["Lisa", "Encaje", "Red", "Microfibra"] },
    { key: "detalle", label: "Detalle", opciones: ["Sin detalle", "Costura", "Velo", "Brillo"] },
  ],
  accesorio: [
    { key: "tipo", label: "Tipo", opciones: ["Bata", "Cinturón", "Ligas", "Gorra", "Joyería", "Otros"] },
    { key: "material", label: "Material", opciones: ["Seda", "Encaje", "Cuero", "Algodón", "Sintético"] },
    { key: "ajuste", label: "Ajuste", opciones: ["Ajustable", "Única talla", "Tallas"] },
  ],
};

const ATRIBUTOS_COMUNES: CampoExtra[] = [
  { key: "temporada", label: "Temporada", opciones: ["Todo el año", "Primavera-Verano", "Otoño-Invierno"] },
  { key: "cuidado", label: "Cuidado", opciones: ["Lavado a mano", "Lavadora fría", "Lavado en seco"] },
  { key: "origen", label: "País de origen" },
];

const variantVacia = (price = ""): VariantForm => ({
  sku: "",
  talla: "",
  color: "",
  colorHex: "#14100e",
  price,
  stock: "0",
  active: true,
});

const formVacio: FormState = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  ofertaActiva: false,
  offerEndsAt: "",
  marca: "",
  material: "",
  genero: "Mujer",
  tipoArticulo: "",
  atributos: {},
  images: [],
  variants: [variantVacia()],
  active: true,
};

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function aInputFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function aFormulario(p: ProductDetail): FormState {
  const ft: FichaTecnica | null | undefined = p.fichaTecnica;
  const oferta = !!p.compareAtPrice && p.compareAtPrice > p.price;
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    categoryId: p.category.id,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    ofertaActiva: oferta,
    offerEndsAt: p.offerEndsAt ? aInputFecha(p.offerEndsAt) : "",
    marca: ft?.marca ?? "",
    material: ft?.material ?? "",
    genero: ft?.genero ?? "Mujer",
    tipoArticulo: ft?.tipoArticulo ?? "",
    atributos: { ...(ft?.atributos ?? {}) },
    images: (p.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      color: img.color ?? "",
    })),
    variants:
      p.variants.length > 0
        ? p.variants.map((v) => {
            const nombre = v.name ?? "";
            const [talla] = nombre.split(" / ");
            return {
              sku: v.sku,
              talla: talla === "Única" ? "" : talla,
              color: v.color ?? "",
              colorHex: v.colorHex ?? "#14100e",
              price: String(v.price),
              stock: String(v.stock),
              active: v.active !== false,
            };
          })
        : [variantVacia(String(p.price))],
    active: p.active !== false,
  };
}

function validar(f: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.name.trim()) errs.name = "El nombre es obligatorio.";
  if (!f.slug.trim()) errs.slug = "El slug es obligatorio.";
  else if (!/^[a-z0-9-]+$/.test(f.slug.trim()))
    errs.slug = "Solo minúsculas, números y guiones.";
  if (!f.price.trim() || Number(f.price) <= 0)
    errs.price = "Ingresa un precio válido.";
  if (!f.categoryId) errs.categoryId = "Elige una categoría.";
  if (f.ofertaActiva) {
    if (!f.compareAtPrice.trim() || Number(f.compareAtPrice) <= Number(f.price))
      errs.compareAtPrice = "Debe ser mayor al precio de oferta.";
  }
  if (f.variants.some((v) => !v.sku.trim()))
    errs.variants = "Cada variante necesita un SKU.";
  if (f.variants.some((v) => !v.price.trim() || Number(v.price) <= 0))
    errs.variants = errs.variants ?? "Cada variante necesita un precio.";
  if (f.images.some((img) => img.url.trim() && !/^(https?:\/\/|\/)/.test(img.url.trim())))
    errs.images = "Las URLs deben empezar por https:// o /.";
  return errs;
}

/** Fila compacta de un atributo activable de la ficha técnica. */
function AtributoFila({
  campo,
  valor,
  onToggle,
  onChange,
  id,
}: {
  campo: CampoExtra;
  valor?: string;
  onToggle: (activo: boolean) => void;
  onChange: (valor: string) => void;
  id: string;
}) {
  const activo = valor !== undefined;
  return (
    <div className="bg-crema p-3">
      <Toggle
        label={campo.label}
        checked={activo}
        onChange={onToggle}
      />
      {activo &&
        (campo.opciones ? (
          <Select
            id={id}
            label="Valor"
            value={valor ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2"
          >
            <option value="">Seleccionar…</option>
            {campo.opciones.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id={id}
            label="Valor"
            value={valor ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2"
          />
        ))}
    </div>
  );
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [abierto, setAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formVacio);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.products({ limit: 50 })
      .then((r) => {
        if (!cancelled) setProducts(r.items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      });
    void api.categories()
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function recargar() {
    setError(null);
    setReloadKey((k) => k + 1);
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function abrirNuevo() {
    setEditandoId(null);
    setForm({ ...formVacio, categoryId: categories[0]?.id ?? "" });
    setErrs({});
    setMsg(null);
    setAbierto(true);
  }

  async function abrirEditar(p: Product) {
    setEditandoId(p.id);
    setForm({
      ...formVacio,
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      ofertaActiva: !!p.compareAtPrice && p.compareAtPrice > p.price,
      categoryId: p.category.id,
      images: p.images.map((img) => ({ url: img.url, alt: img.alt ?? "", color: img.color ?? "" })),
      active: p.active !== false,
    });
    setErrs({});
    setMsg(null);
    setAbierto(true);
    try {
      setForm(aFormulario(await api.product(p.slug)));
    } catch {
      setMsg({
        texto: "No pudimos cargar la ficha completa; revisa antes de guardar.",
        ok: false,
      });
    }
  }

  function setVariante(i: number, key: keyof VariantForm, value: string | boolean) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) =>
        idx === i ? { ...v, [key]: value } : v,
      ),
    }));
  }

  function setImagen(i: number, key: keyof ImageForm, value: string) {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, idx) =>
        idx === i ? { ...img, [key]: value } : img,
      ),
    }));
  }

  function setAtributo(key: string, valor: string | undefined) {
    setForm((f) => {
      const atributos = { ...f.atributos };
      if (valor === undefined) delete atributos[key];
      else atributos[key] = valor;
      return { ...f, atributos };
    });
  }

  function cambiarTipo(tipo: string) {
    setForm((f) => {
      const permitidas = new Set(
        [
          ...(ATRIBUTOS_POR_TIPO[tipo] ?? []),
          ...ATRIBUTOS_COMUNES,
        ].map((c) => c.key),
      );
      const atributos = Object.fromEntries(
        Object.entries(f.atributos).filter(([key]) => permitidas.has(key)),
      );
      return { ...f, tipoArticulo: tipo, atributos };
    });
  }

  function nombreVariante(v: VariantForm) {
    const partes = [v.talla.trim() || "Única", v.color.trim()].filter(Boolean);
    return partes.join(" / ");
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const errors = validar(form);
    setErrs(errors);
    if (Object.keys(errors).length > 0) return;

    setGuardando(true);
    setMsg(null);
    const payload: ProductInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      compareAtPrice: form.ofertaActiva ? Number(form.compareAtPrice) : null,
      categoryId: form.categoryId,
      images: form.images
        .filter((img) => img.url.trim())
        .map((img, idx) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || form.name.trim(),
          order: idx,
          color: img.color.trim() || null,
          type: "image",
        })),
      variants: form.variants.map((v) => ({
        sku: v.sku.trim(),
        name: nombreVariante(v),
        price: Number(v.price),
        stock: Number(v.stock) || 0,
        color: v.color.trim() || null,
        colorHex: v.colorHex || null,
        active: v.active,
      })),
      active: form.active,
      offerEndsAt:
        form.ofertaActiva && form.offerEndsAt
          ? new Date(form.offerEndsAt).toISOString()
          : null,
      fichaTecnica: {
        marca: form.marca.trim(),
        material: form.material.trim(),
        genero: form.genero,
        tipoArticulo: form.tipoArticulo,
        atributos: form.atributos,
      },
    };

    try {
      if (editandoId) await api.admin.updateProduct(editandoId, payload);
      else await api.admin.createProduct(payload);
      setMsg({
        texto: editandoId ? "Producto actualizado." : "Producto creado.",
        ok: true,
      });
      setAbierto(false);
      recargar();
    } catch (err) {
      setMsg({
        texto: err instanceof ApiError ? err.message : "No pudimos guardar el producto.",
        ok: false,
      });
    } finally {
      setGuardando(false);
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Productos" />
        <ErrorState message={error} onRetry={recargar} />
      </>
    );
  }

  if (products === null) {
    return (
      <>
        <PageHeader title="Productos" />
        <Spinner label="Cargando productos…" />
      </>
    );
  }

  const colores = Array.from(
    new Set(form.variants.map((v) => v.color.trim()).filter(Boolean)),
  );

  return (
    <>
      <PageHeader
        title="Productos"
        meta={`${products.length} ${products.length === 1 ? "producto" : "productos"}`}
        action={
          <Button onClick={abrirNuevo}>
            <PlusIcon />
            Nuevo producto
          </Button>
        }
      />

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

      {abierto && (
        <form onSubmit={guardar} noValidate className="mb-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-carbon">
                {editandoId ? "Editar producto" : "Nuevo producto"}
              </h2>
              <p className="mt-1 text-sm text-tibio">
                Completa por secciones. Solo la información básica es obligatoria.
              </p>
            </div>
            <p className="text-xs text-tibio">
              Ficha técnica, colores y estado requieren la nota 20 del contrato.
            </p>
          </div>

          <SectionCard title="Información básica" description="Nombre, URL y descripción que ve el cliente.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="p-name"
                label="Nombre"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || slugify(e.target.value),
                  }));
                }}
                error={errs.name}
                required
              />
              <Input
                id="p-slug"
                label="Slug (URL)"
                value={form.slug}
                onChange={set("slug")}
                error={errs.slug}
                hint="conjunto-encaje-15m"
                required
              />
              <Select
                id="p-category"
                label="Categoría"
                value={form.categoryId}
                onChange={set("categoryId")}
                error={errs.categoryId}
              >
                <option value="">Elige una categoría…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Toggle
                label="Producto activo"
                description="Controla si aparece en la tienda."
                checked={form.active}
                onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
            <Textarea
              id="p-desc"
              label="Descripción"
              value={form.description}
              onChange={set("description")}
              rows={4}
              hint="Texto libre: materiales, ajuste y cuidados."
            />
          </SectionCard>

          <SectionCard
            title="Ficha técnica"
            description="El tipo de artículo activa los atributos que aplican a esta pieza."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input id="f-marca" label="Marca" value={form.marca} onChange={set("marca")} />
              <Input id="f-material" label="Material" value={form.material} onChange={set("material")} />
              <Select id="f-genero" label="Género" value={form.genero} onChange={set("genero")}>
                <option value="">Sin especificar</option>
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
                <option value="Unisex">Unisex</option>
              </Select>
              <Select
                id="f-tipo"
                label="Tipo de artículo"
                value={form.tipoArticulo}
                onChange={(e) => cambiarTipo(e.target.value)}
              >
                <option value="">Sin especificar</option>
                {TIPOS_ARTICULO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            {form.tipoArticulo && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-tibio">
                  Atributos de {TIPOS_ARTICULO.find((t) => t.value === form.tipoArticulo)?.label.toLowerCase()}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ATRIBUTOS_POR_TIPO[form.tipoArticulo]?.map((campo) => (
                    <AtributoFila
                      key={campo.key}
                      id={`attr-${campo.key}`}
                      campo={campo}
                      valor={form.atributos[campo.key]}
                      onToggle={(activo) => setAtributo(campo.key, activo ? "" : undefined)}
                      onChange={(valor) => setAtributo(campo.key, valor)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-tibio">
                Comunes
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ATRIBUTOS_COMUNES.map((campo) => (
                  <AtributoFila
                    key={campo.key}
                    id={`attr-${campo.key}`}
                    campo={campo}
                    valor={form.atributos[campo.key]}
                    onToggle={(activo) => setAtributo(campo.key, activo ? "" : undefined)}
                    onChange={(valor) => setAtributo(campo.key, valor)}
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Precios (COP)" description="Precio de venta y, si aplica, oferta con vigencia.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="p-price"
                label={form.ofertaActiva ? "Precio de oferta" : "Precio"}
                type="number"
                inputMode="numeric"
                min={0}
                value={form.price}
                onChange={set("price")}
                error={errs.price}
                required
              />
              <div className="border-t border-tinta/10 pt-4 sm:border-0 sm:pt-0">
                <Toggle
                  label="Activar oferta"
                  description="El precio anterior aparece tachado."
                  checked={form.ofertaActiva}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      ofertaActiva: v,
                      compareAtPrice: v ? f.compareAtPrice : "",
                      offerEndsAt: v ? f.offerEndsAt : "",
                    }))
                  }
                />
              </div>
              {form.ofertaActiva && (
                <>
                  <Input
                    id="p-compare"
                    label="Precio normal"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.compareAtPrice}
                    onChange={set("compareAtPrice")}
                    error={errs.compareAtPrice}
                    hint="Debe ser mayor al precio de oferta."
                  />
                  <Input
                    id="p-oferta-hasta"
                    label="Vence el (opcional)"
                    type="datetime-local"
                    value={form.offerEndsAt}
                    onChange={set("offerEndsAt")}
                    hint="Sin fecha, la oferta no tiene límite."
                  />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Variantes — talla × color × stock"
            description="Cada combinación es una variante con SKU, precio e inventario propios."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    variants: [...f.variants, variantVacia(f.price)],
                  }))
                }
              >
                <PlusIcon />
                Agregar variante
              </Button>
            }
          >
            {form.variants.length === 0 ? (
              <p className="py-6 text-center text-sm text-tibio">
                Sin variantes. Agrega al menos una para poder guardar.
              </p>
            ) : (
              <div className="tabla-scroll">
                <table className="w-full min-w-[840px] text-sm">
                  <thead>
                    <tr className="border-b border-tinta/10 text-left text-xs uppercase tracking-[0.12em] text-tibio">
                      <th scope="col" className="px-2 py-2 font-semibold">SKU</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Talla</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Color</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Hex</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Precio</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Stock</th>
                      <th scope="col" className="px-2 py-2 font-semibold">Activa</th>
                      <th scope="col" className="px-2 py-2"><span className="sr-only">Quitar</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((v, i) => (
                      <tr key={i} className="border-b border-tinta/5">
                        <td className="px-2 py-2">
                          <input
                            aria-label={`SKU de la variante ${i + 1}`}
                            value={v.sku}
                            onChange={(e) => setVariante(i, "sku", e.target.value)}
                            className="min-h-11 w-32 border border-tibio/30 bg-white px-2"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label={`Talla de la variante ${i + 1}`}
                            value={v.talla}
                            onChange={(e) => setVariante(i, "talla", e.target.value)}
                            placeholder="M"
                            className="min-h-11 w-20 border border-tibio/30 bg-white px-2"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label={`Color de la variante ${i + 1}`}
                            value={v.color}
                            onChange={(e) => setVariante(i, "color", e.target.value)}
                            placeholder="Vino"
                            className="min-h-11 w-28 border border-tibio/30 bg-white px-2"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="color"
                            aria-label={`Color hexadecimal de la variante ${i + 1}`}
                            value={v.colorHex}
                            onChange={(e) => setVariante(i, "colorHex", e.target.value)}
                            className="size-11 border border-tibio/30 bg-white p-1"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            aria-label={`Precio de la variante ${i + 1}`}
                            value={v.price}
                            onChange={(e) => setVariante(i, "price", e.target.value)}
                            className="tabular min-h-11 w-28 border border-tibio/30 bg-white px-2"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            aria-label={`Stock de la variante ${i + 1}`}
                            value={v.stock}
                            onChange={(e) => setVariante(i, "stock", e.target.value)}
                            className="tabular min-h-11 w-20 border border-tibio/30 bg-white px-2"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Variante ${i + 1} activa`}
                            checked={v.active}
                            onChange={(e) => setVariante(i, "active", e.target.checked)}
                            className="size-5 accent-[#14100e]"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                variants: f.variants.filter((_, idx) => idx !== i),
                              }))
                            }
                            aria-label={`Quitar variante ${i + 1}`}
                            className="inline-flex size-11 items-center justify-center text-vino hover:bg-vino/10"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {errs.variants && (
              <p className="text-xs font-medium text-vino">{errs.variants}</p>
            )}
          </SectionCard>

          <SectionCard
            title="Imágenes"
            description="URL directas, sin subida de archivos. La primera es la principal."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    images: [...f.images, { url: "", alt: "", color: "" }],
                  }))
                }
              >
                <ImageIcon />
                Agregar imagen
              </Button>
            }
          >
            {form.images.length === 0 ? (
              <p className="py-6 text-center text-sm text-tibio">
                Sin imágenes. Puedes dejarlo vacío y añadirlas después.
              </p>
            ) : (
              <div className="space-y-3">
                {form.images.map((img, i) => (
                  <div key={i} className="border border-tinta/10 bg-crema p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-tibio">
                        Imagen {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {i === 0 && <Badge tone="info">Principal</Badge>}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              images: f.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          aria-label={`Quitar imagen ${i + 1}`}
                          className="inline-flex size-11 items-center justify-center text-vino hover:bg-vino/10"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        id={`img-url-${i}`}
                        label="URL"
                        type="url"
                        value={img.url}
                        onChange={(e) => setImagen(i, "url", e.target.value)}
                        className="sm:col-span-2"
                      />
                      <Select
                        id={`img-color-${i}`}
                        label="Color (opcional)"
                        value={img.color}
                        onChange={(e) => setImagen(i, "color", e.target.value)}
                      >
                        <option value="">Sin color</option>
                        {colores.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </Select>
                      <Input
                        id={`img-alt-${i}`}
                        label="Texto alternativo"
                        value={img.alt}
                        onChange={(e) => setImagen(i, "alt", e.target.value)}
                        className="sm:col-span-3"
                        hint="Describe la imagen para lectores de pantalla."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errs.images && <p className="text-xs font-medium text-vino">{errs.images}</p>}
          </SectionCard>

          <div className="flex flex-wrap gap-3 border-t border-tinta/10 pt-5">
            <Button type="submit" loading={guardando}>
              {editandoId ? "Guardar cambios" : "Crear producto"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="px-6 py-16 text-center text-tibio">
          Aún no hay productos. Crea el primero con el botón de arriba.
        </p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="border border-tinta/10 bg-white p-4 sm:flex sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-4 sm:flex-1">
                <span className="size-14 shrink-0 overflow-hidden bg-crema">
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt="" className="size-full object-cover" />
                  ) : (
                    <span aria-hidden="true" className="flex size-full items-center justify-center bg-nude">
                      <ImageIcon className="size-7 text-tibio/70" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-carbon">{p.name}</p>
                  <p className="truncate text-sm text-tibio">
                    {p.category.name} · /{p.slug}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-tinta/10 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                <span className="tabular font-semibold text-tinta">{formatCOP(p.price)}</span>
                {p.compareAtPrice && p.compareAtPrice > p.price && (
                  <Badge tone="warning">Oferta</Badge>
                )}
                {p.active === false && <Badge tone="danger">Inactivo</Badge>}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void abrirEditar(p)}
                  className="ml-auto underline decoration-tinta/30 underline-offset-4 hover:decoration-tinta sm:ml-0"
                >
                  Editar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
