import { google } from "googleapis";

type SheetLeadData = {
  name: string;
  email: string;
  phone: string;
  source: string;
  dateOfBirth?: string | null;
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

function parseDateOfBirth(dateOfBirth?: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const trimmedDate = dateOfBirth.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(trimmedDate);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function calculateAge(dateOfBirth?: string | null) {
  const birthDate = parseDateOfBirth(dateOfBirth);

  if (!birthDate) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

export async function appendToSheet(data: SheetLeadData) {
  try {
    const client = await getSheetsClient();

    if (!client) {
      return;
    }

    const now = new Date();
    const rowsResponse = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: "Sheet1!A:A",
    });
    const rowCount = rowsResponse.data.values?.length ?? 0;
    const slNumber = Math.max(rowCount, 1);

    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.spreadsheetId,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            slNumber,
            formatDateForSheet(now),
            formatTimeForSheet(now),
            data.name,
            calculateAge(data.dateOfBirth),
            data.phone,
            data.email,
            data.source,
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
      range: "Sheet1!A:H",
    });

    const rows = response.data.values ?? [];
    let targetRowNumber: number | null = null;

    rows.forEach((row, index) => {
      const rowEmail = String(row[6] ?? "").trim().toLowerCase();
      const rowPhone = String(row[5] ?? "").trim().toLowerCase();

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
      range: `Sheet1!F${targetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[normalizedPhone]],
      },
    });
  } catch (error) {
    console.error("Google Sheets phone update failed:", error);
  }
}
