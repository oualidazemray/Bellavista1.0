// src/app/admin/reservations/[reservationId]/details/page.tsx
"use client";
import { useParams } from "next/navigation";

export default function AdminReservationDetailPage() {
  const params = useParams();
  const reservationId = params.reservationId;
  return (
    <div className="text-white p-6">
      Details for Reservation ID: {reservationId} (Content to be built)
    </div>
  );
}
