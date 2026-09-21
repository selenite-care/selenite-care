"use client";

import OneTimeConsultationsPage from "@/components/consultations/OneTimeConsultationsPage";

export default function AdminOneTimeConsultationsPage() {
  return (
    <OneTimeConsultationsPage
      apiPath="/api/admin/one-time-consultations"
      bookingBasePath="/admin/bookings"
      followUpEndpointBase="/api/admin/one-time-consultations"
    />
  );
}
