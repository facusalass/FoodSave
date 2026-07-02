import { findOfferByIdPublic, listOffers } from "../services/offerService.js";
export async function listOffersController(request, response) {
    const { category, type, city, page, limit } = request.query;
    const offers = await listOffers({
        category, type, city,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
    });
    response.json({ success: true, data: { offers } });
}
export async function getOfferController(request, response) {
    const offerId = request.params.id;
    if (!offerId || Array.isArray(offerId)) {
        response.status(400).json({
            success: false,
            error: { message: "ID de oferta inválido." }
        });
        return;
    }
    const offer = await findOfferByIdPublic(offerId);
    if (!offer) {
        response.status(404).json({
            success: false,
            error: { message: "Oferta no encontrada." }
        });
        return;
    }
    response.json({ success: true, data: { offer } });
}
