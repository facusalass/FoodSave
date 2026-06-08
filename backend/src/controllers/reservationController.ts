import type { Request, Response } from "express";
import {
  listReservationsForUser,
  updateReservationStatus
} from "../services/reservationService.js";
import type { ReservationStatus } from "../types/reservation.js";

export function listReservationsController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    response.status(401).json({ message: "Usuario no autenticado." });
    return;
  }

  response.json({ reservations: listReservationsForUser(request.user) });
}

export function updateReservationStatusController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    response.status(401).json({ message: "Usuario no autenticado." });
    return;
  }

  const { status } = request.body as { status?: ReservationStatus };

  if (!status) {
    response.status(400).json({ message: "Estado requerido." });
    return;
  }

  const reservationId = request.params.id;

  if (!reservationId || Array.isArray(reservationId)) {
    response.status(400).json({ message: "ID de reserva inválido." });
    return;
  }

  const reservation = updateReservationStatus(
    reservationId,
    status,
    request.user
  );

  if (!reservation) {
    response.status(404).json({
      message: "Reserva no encontrada o cambio de estado no permitido."
    });
    return;
  }

  response.json({ reservation });
}
