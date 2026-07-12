// apiRequest arma headers, agrega el token cuando corresponde y hace fetch al backend.
import { apiRequest } from "./apiClient";
// Tipos que describen una oferta y sus variantes.
import type { Offer, OfferType } from "../types/offer";

// Filtros opcionales para las ofertas publicas que ve el cliente.
type GetOffersOptions = {
  city?: string | null;
};

type PaginatedOffersResponse = {
  offers: Offer[] | {
    items?: Offer[];
  };
};

// Datos necesarios para crear una oferta desde la pantalla Publicar.
export type CreateBusinessOfferPayload = {
  title: string;
  description: string;
  category: string;
  type: OfferType;
  oldPrice: number;
  newPrice: number;
  stock: number;
  pickupWindow?: string;
  pickupLimit?: string;
  allergens?: string[];
  imageUrl?: string;
  estimatedWeightInKg?: number;
};

// Para editar no hace falta mandar todos los campos de la oferta.
export type UpdateBusinessOfferPayload = Partial<CreateBusinessOfferPayload>;

export type BusinessProfilePayload = {
  name?: string;
  category?: string;
  description?: string;
  city?: string;
  address?: string;
  closingTime?: string;
  logoUrl?: string;
  paymentInfo?: {
    ownerName: string;
    cvu: string;
    alias: string;
  };
};

export type BusinessProfile = {
  id: string;
  name: string;
  ownerId: string;
  isActive?: boolean;
  category: string;
  description: string;
  city: string;
  address: string;
  closingTime: string;
  logoUrl?: string;
  paymentInfo?: {
    ownerName?: string;
    cvu?: string;
    alias?: string;
  };
  createdAt?: string;
};

// READ publico: el cliente obtiene las ofertas visibles, opcionalmente filtradas por ciudad.
export async function getOffers(options: GetOffersOptions = {}) {
  const queryParams = new URLSearchParams();

  if (options.city) {
    queryParams.set("city", options.city);
  }

  // Armamos GET /offers o GET /offers?city=... segun el filtro elegido.
  const path = queryParams.toString()
    ? `/offers?${queryParams.toString()}`
    : "/offers";
  const response = await apiRequest<PaginatedOffersResponse>(path);

  // El backend puede devolver la lista directa o dentro de items por paginacion.
  if (Array.isArray(response.offers)) {
    return response.offers;
  }

  return Array.isArray(response.offers.items) ? response.offers.items : [];
}

// READ publico de una sola oferta para la pantalla de detalle.
export async function getOfferById(id: string) {
  const response = await apiRequest<{ offer: Offer }>(`/offers/${id}`);
  return response.offer;
}

// CREATE: el comercio crea una oferta nueva. El token identifica al comercio.
export async function createBusinessOffer(
  token: string,
  payload: CreateBusinessOfferPayload
) {
  const response = await apiRequest<{ offer: Offer }>("/business/offers", {
    // Los datos de la oferta viajan como JSON en POST /business/offers.
    body: JSON.stringify(payload),
    method: "POST",
    token
  });

  return response.offer;
}

// UPDATE: modifica los datos de una oferta existente del comercio.
export async function updateBusinessOffer(
  token: string,
  offerId: string,
  payload: UpdateBusinessOfferPayload
) {
  const response = await apiRequest<{ offer: Offer }>(
    `/business/offers/${offerId}`,
    {
      body: JSON.stringify(payload),
      method: "PUT",
      token
    }
  );

  return response.offer;
}

// DELETE: elimina una oferta. La pantalla Mi Local llama esta funcion al confirmar la papelera.
export async function deleteBusinessOffer(token: string, offerId: string) {
  await apiRequest<{ message: string }>(`/business/offers/${offerId}`, {
    method: "DELETE",
    token
  });
}

// Lee los datos del comercio autenticado para la pantalla Mi Local.
export async function getBusinessProfile(token: string) {
  const response = await apiRequest<{ business: BusinessProfile }>(
    "/business/profile",
    { token }
  );

  return response.business;
}

// READ del comercio: trae sus propias publicaciones, incluso las ocultas.
export async function getBusinessOffers(token: string) {
  const response = await apiRequest<{ offers: Offer[] }>("/business/offers", {
    token
  });

  return response.offers;
}

// Actualiza los datos del local: nombre, ciudad, horario, logo o datos de cobro.
export async function updateBusinessProfile(
  token: string,
  payload: BusinessProfilePayload
) {
  const response = await apiRequest<{ business: BusinessProfile }>(
    "/business/profile",
    {
      body: JSON.stringify(payload),
      method: "PUT",
      token
    }
  );

  return response.business;
}

// UPDATE parcial: solo cambia si una oferta esta visible u oculta para clientes.
export async function updateBusinessOfferVisibility(
  token: string,
  offerId: string,
  isVisible: boolean
) {
  const response = await apiRequest<{ offer: Offer }>(
    `/business/offers/${offerId}/visibility`,
    {
      body: JSON.stringify({ isVisible }),
      method: "PATCH",
      token
    }
  );

  return response.offer;
}

// Datos del archivo seleccionado antes de subirlo al backend.
export type UploadImagePayload = {
  name: string;
  type: string;
  uri: string;
};

// Sube una imagen del producto y devuelve la URL que luego se guarda en imageUrl.
export async function uploadImage(token: string, image: UploadImagePayload) {
  // FormData permite enviar un archivo, no un JSON comun.
  const formData = new FormData();
  formData.append(
    "file",
    {
      name: image.name,
      type: image.type,
      uri: image.uri
    } as unknown as Blob
  );

  const response = await apiRequest<{ url: string }>("/upload/image", {
    // apiClient detecta FormData y no agrega Content-Type manualmente.
    body: formData,
    method: "POST",
    token
  });

  return response.url;
}
