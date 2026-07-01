import { google } from "googleapis";

type SheetLeadData = {
  name: string;
  email: string;
  phone: string;
  source: string;
  dob?: string | null;
};

async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error("Google Sheets sync skipped: missing environment variables.");
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth }),
  };
}

function formatDateForSheet(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTimeForSheet(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export async function appendToSheet(data: SheetLeadData) {
  try {
    const client = await getSheetsClient();

    if (!client) {
      return;
    }

    const now = new Date();

    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.spreadsheetId,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.name,
            data.email,
            data.phone,
            data.source,
            formatDateForSheet(now),
            formatTimeForSheet(now),
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Google Sheets sync failed:", error);
  }
}

export async function updateSheetPhoneByEmail(email: string, phone: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail || !normalizedPhone) {
      return;
    }

    const client = await getSheetsClient();

    if (!client) {
      return;
    }

    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: "Sheet1!A:F",
    });

    const rows = response.data.values ?? [];
    let targetRowNumber: number | null = null;

    rows.forEach((row, index) => {
      const rowEmail = String(row[1] ?? "").trim().toLowerCase();
      const rowPhone = String(row[2] ?? "").trim().toLowerCase();

      if (rowEmail !== normalizedEmail) {
        return;
      }

      if (!rowPhone || rowPhone === "not provided yet") {
        targetRowNumber = index + 1;
      }
    });

    if (!targetRowNumber) {
      return;
    }

    await client.sheets.spreadsheets.values.update({
      spreadsheetId: client.spreadsheetId,
      range: `Sheet1!C${targetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[normalizedPhone]],
      },
    });
  } catch (error) {
    console.error("Google Sheets phone update failed:", error);
  }
}
