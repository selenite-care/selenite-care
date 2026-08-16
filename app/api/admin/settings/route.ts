import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSetting } from "@/lib/settings";

const { auth } = NextAuth(authConfig);

type SettingUpdate = {
  key?: unknown;
  value?: unknown;
};

type SettingsPatchPayload = {
  settings?: unknown;
};

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      response: Response.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const settings = await db.appSetting.findMany({
    orderBy: {
      key: "asc",
    },
  });

  return Response.json({ settings });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as
    | SettingsPatchPayload
    | SettingUpdate[]
    | null;
  const updates = Array.isArray(body) ? body : body?.settings;

  if (!Array.isArray(updates)) {
    return Response.json(
      { error: "Settings must be an array of key/value objects." },
      { status: 400 },
    );
  }

  const normalizedUpdates = updates
    .map((item) => {
      const candidate = item as SettingUpdate;
      const key = typeof candidate.key === "string" ? candidate.key.trim() : "";
      const value =
        typeof candidate.value === "string" ? candidate.value.trim() : "";

      return { key, value };
    })
    .filter((item) => item.key);

  if (normalizedUpdates.length === 0) {
    return Response.json(
      { error: "At least one valid setting is required." },
      { status: 400 },
    );
  }

  await Promise.all(
    normalizedUpdates.map((setting) =>
      updateSetting(setting.key, setting.value, session?.user.id),
    ),
  );

  const settings = await db.appSetting.findMany({
    orderBy: {
      key: "asc",
    },
  });

  return Response.json({ settings });
}
