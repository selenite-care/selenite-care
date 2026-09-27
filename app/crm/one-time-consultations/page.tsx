"use client";

import OneTimeConsultationsPage from "@/components/consultations/OneTimeConsultationsPage";

export default function CrmOneTimeConsultationsPage() {
  return (
    <OneTimeConsultationsPage
      apiPath="/api/crm/one-time-consultations"
      bookingBasePath="/crm/bookings"
      messagesBasePath="/crm/messages"
      followUpEndpointBase="/api/admin/one-time-consultations"
    />
  );
}
