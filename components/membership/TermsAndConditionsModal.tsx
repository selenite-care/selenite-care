"use client";

type TermsAndConditionsModalProps = {
  onClose: () => void;
};

export default function TermsAndConditionsModal({
  onClose,
}: TermsAndConditionsModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close terms and conditions"
        onClick={onClose}
        className="modal-overlay absolute inset-0"
        style={{ backgroundColor: "rgba(43, 43, 43, 0.82)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-and-conditions-title"
        className="modal-card relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-[#D8C7B5] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#242220]"
        style={{
          boxShadow: "0 28px 80px rgba(43, 43, 43, 0.25)",
        }}
      >
        <div
          className="border-b border-[#D8C7B5] px-6 pb-5 pt-6 dark:border-[#3D3530] sm:px-8"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D8C7B5] bg-white/90 text-lg text-[#2B2B2B] transition-colors hover:bg-white dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:hover:bg-[#2A2724]"
            style={{
            }}
          >
            x
          </button>

          <p
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A56B] dark:text-[#D4B47A]"
          >
            Terms & Conditions
          </p>
          <h2
            id="terms-and-conditions-title"
            className="mt-3 text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-3xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Terms
          </h2>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <div className="space-y-5 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
            <h1>1. Membership Validity</h1>
            <p>The membership shall remain valid for the specified duration from the date of activation.
            Platinum Membership must be renewed upon every year to continue enjoying member benefits.</p>

            <h1>2. Membership Fee</h1>
            <p>Membership fees are generally non-refundable once paid. In exceptional circumstances, any refund decision shall be made solely at the discretion of Selenite Care, and such decision shall be considered final.</p>

            <h1>3. Personal Use Only</h1>
            <p>Membership is strictly intended for the registered member only. Membership benefits may not be transferred, sold, shared, or assigned to any other individual.</p>

            <h1>4. Consultation Service</h1>
            <p>Consultation services provided by Selenite Care are intended for skincare guidance and aesthetic consultation purposes only. These services do not constitute medical diagnosis, prescription, treatment, or emergency medical care.</p>

            <h1>5. Appointment Policy</h1>
            <p></p>Members are required to book an appointment prior to receiving consultation services. Requests for appointment rescheduling should be made at least 24 hours before the scheduled appointment time.

            <h1>6. Customer Information</h1>
            <p>Members are responsible for providing accurate and up-to-date personal information.
            Selenite Care shall not be held responsible for any issues arising from inaccurate or incomplete information provided by the member.</p>

            <h1>7. Product Recommendations</h1>
            <p>Product recommendations will be provided based on the member’s skin type, skin condition, and concerns. Results may vary from person to person, and no specific outcome or result is guaranteed.</p>

            <h1>8. Membership Benefits</h1>
            <p>Selenite Care reserves the right to modify, add, suspend, or discontinue membership benefits at any time. Members will be informed of significant changes whenever reasonably possible.</p>

            <h1>9. Code of Conduct</h1>
            <p>Members are expected to maintain respectful and professional behavior towards Selenite Care staff, aestheticians, and other members. Any abusive, inappropriate, or disruptive conduct may result in suspension or termination of membership.</p>

            <h1>10. Membership Cancellation</h1>
            <p>Selenite Care reserves the right to suspend or cancel any membership in cases of fraud, misuse, submission of false information, or violation of these Terms & Conditions.</p>

            <h1>11. Privacy Policy</h1>
            <p>All personal information provided by members will be kept confidential and securely maintained. Information will not be disclosed to third parties except where required by law or with the member’s consent.</p>

            <h1>12. Limitation of Liability</h1>
            <p>Skincare outcomes may vary depending on individual factors, including lifestyle, hormones, diet, medical conditions, and adherence to recommended routines. Selenite Care does not guarantee specific results or improvements within any particular timeframe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
