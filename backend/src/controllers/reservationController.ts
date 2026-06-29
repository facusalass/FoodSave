import type { Request, Response } from "express";
import {
  createReservation,
  listReservationsForUser,
  updateReservationStatus
} from "../services/reservationService.js";
import type { ReservationStatus } from "../types/reservation.js";

export async function listReservationsController(
  request: Request,
  response: Response
) {
  const reservations = await listReservationsForUser(request.user!);
  response.json({ success: true, data: { reservations } });
}

export async function updateReservationStatusController(
  request: Request,
  response: Response
) {
  const { status } = request.body as { status?: ReservationStatus };

  if (!status) {
    response.status(400).json({
      success: false,
      error: { message: "Estado requerido." }
    });
    return;
  }

  const reservationId = request.params.id;

  if (!reservationId || Array.isArray(reservationId)) {
    response.status(400).json({
      success: false,
      error: { message: "ID de reserva inválido." }
    });
    return;
  }

  const reservation = await updateReservationStatus(
    reservationId,
    status,
    request.user!
  );

  if (!reservation) {
    response.status(404).json({
      success: false,
      error: {
        message: "Reserva no encontrada o cambio de estado no permitido."
      }
    });
    return;
  }

  response.json({ success: true, data: { reservation } });
}

export async function createReservationController(
  request: Request,
  response: Response
) {
  const { offerId, quantity } = request.body as {
    offerId?: string;
    quantity?: number;
  };

  if (!offerId || typeof offerId !== "string") {
    response.status(400).json({
      success: false,
      error: { message: "offerId es requerido." }
    });
    return;
  }

  if (!quantity || typeof quantity !== "number" || quantity < 1) {
    response.status(400).json({
      success: false,
      error: { message: "quantity debe ser un número mayor a 0." }
    });
    return;
  }

  const result = await createReservation(offerId, request.user!.id, quantity);

  if ("error" in result) {
    response.status(400).json({
      success: false,
      error: { message: result.error }
    });
    return;
  }

  response.status(201).json({ success: true, data: { reservation: result } });
}
