export function getBirthdayEmailHtml(name: string) {
  const clientName = name.trim() || "Beautiful Soul";

  return `
    <div style="margin:0;padding:32px 16px;background-color:#F8F5F0;font-family:Arial,sans-serif;color:#2B2B2B;">
      <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #EADDCD;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(43,43,43,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#2B2B2B 0%,#3A332D 100%);text-align:center;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#B87B68;font-weight:600;">
            Selenite Care
          </div>
          <h1 style="margin:14px 0 0;font-size:34px;line-height:1.2;font-family:'Playfair Display', Georgia, serif;color:#F8F5F0;font-weight:600;">
            Happy Birthday, ${clientName}
          </h1>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:#4B4037;">
            On behalf of everyone at <strong>Selenite Care</strong>, we are sending you our warmest birthday wishes today.
          </p>

          <div style="margin:24px 0;padding:22px 24px;border:1px solid #EADDCD;border-radius:16px;background:linear-gradient(180deg,rgba(198,165,107,0.10) 0%,rgba(248,245,240,1) 100%);">
            <p style="margin:0;font-size:17px;line-height:1.9;color:#2B2B2B;">
              Dear ${clientName}, may this new year of your life bring you joy, confidence, peace, and beautiful moments that feel as radiant as you are.
            </p>
          </div>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#6E6257;">
            We are grateful to be a small part of your wellness and skincare journey. Your trust means a lot to us, and we hope the year ahead brings you healthy skin, renewed confidence, and many reasons to smile.
          </p>

          <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#6E6257;">
            As a special birthday wish from our team: may your skin journey continue with glow, balance, and gentle care every step of the way.
          </p>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E9DDD0;text-align:center;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#8C7967;">
              With love and warm wishes,<br />
              <span style="font-family:'Playfair Display', Georgia, serif;font-size:18px;color:#B87B68;">Selenite Care</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}
