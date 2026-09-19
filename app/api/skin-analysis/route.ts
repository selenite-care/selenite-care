import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSkinAnalysisPdf } from "@/lib/generateAnalysisPdf";
import { checkAnalysisAccess, generateImageHash } from "@/lib/imageHash";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { analyzeSkinImages } from "@/lib/skinAnalysis";
import { uploadToSupabase } from "@/lib/supabaseStorage";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ANALYSIS_CREDIT_PRICE = 25;
const ANALYSIS_CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;

function getUploadMimeType(file: File) {
  return file.type === "image/jpg" ? "image/jpeg" : file.type;
}

function getImageUploadPath(
  imageHash: string,
  timestamp: number,
  angle: string,
) {
  return `skin-analysis/${imageHash}-${timestamp}-${angle}.jpg`;
}

function getPdfUploadPath(imageHash: string, timestamp: number) {
  return `analysis-pdfs/${imageHash}-${timestamp}.pdf`;
}

function formatCachedAnalysisTime(createdAt: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(createdAt);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const frontImage = formData.get("frontImage");
    const leftImage = formData.get("leftImage");
    const rightImage = formData.get("rightImage");

    if (!(frontImage instanceof File) || frontImage.size === 0) {
      return Response.json(
        { error: "A front-facing image is required." },
        { status: 400 },
      );
    }

    if (
      (leftImage !== null && !(leftImage instanceof File)) ||
      (rightImage !== null && !(rightImage instanceof File))
    ) {
      return Response.json(
        { error: "Optional profile images must be valid image files." },
        { status: 400 },
      );
    }

    const providedImages = [
      {
        file: frontImage,
        label: "Front Face:",
        angle: "front",
      },
      ...(leftImage instanceof File && leftImage.size > 0
        ? [{ file: leftImage, label: "Left Profile:", angle: "left" }]
        : []),
      ...(rightImage instanceof File && rightImage.size > 0
        ? [{ file: rightImage, label: "Right Profile:", angle: "right" }]
        : []),
    ];

    for (const { file, label } of providedImages) {
      const mimeType = getUploadMimeType(file);

      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        return Response.json(
          {
            error: `${label} must be a jpeg, jpg, png, webp, or heic image.`,
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return Response.json(
          { error: `${label} must be under 10MB.` },
          { status: 400 },
        );
      }
    }

    const imageDataArray = await Promise.all(
      providedImages.map(async ({ file, label, angle }) => {
        const buffer = Buffer.from(await file.arrayBuffer());

        return {
          buffer,
          base64: buffer.toString("base64"),
          mimeType: getUploadMimeType(file),
          label,
          angle,
        };
      }),
    );
    const imageHash = await generateImageHash(imageDataArray[0].buffer);
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const cacheWindowStart = new Date(Date.now() - ANALYSIS_CACHE_WINDOW_MS);
    const existing = await db.skinAnalysis.findFirst({
      where: userId
        ? {
            userId,
            createdAt: {
              gte: cacheWindowStart,
            },
          }
        : {
            imageHash,
          },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        skinType: true,
        concerns: true,
        fullAnalysis: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    if (existing) {
      return Response.json({
        cached: true,
        analysisId: existing.id,
        skinType: existing.skinType,
        concerns: existing.concerns,
        fullAnalysis: existing.fullAnalysis,
        summary: "",
        consultationNote: "",
        pdfUrl: existing.pdfUrl,
        ...(userId
          ? {
              message: `Showing your most recent analysis from ${formatCachedAnalysisTime(existing.createdAt)}. Upload new photos to run a fresh analysis.`,
            }
          : {}),
      });
    }

    const access = await checkAnalysisAccess(userId);

    if (access.requiresPayment && access.paidCredits === 0) {
      return Response.json(
        {
          error: "PAYMENT_REQUIRED",
          price: ANALYSIS_CREDIT_PRICE,
          message: "Purchase an analysis credit to continue.",
        },
        { status: 402 },
      );
    }

    const [activeMembership, creditRecord, clientProfile] = userId
      ? await Promise.all([
          db.membership.findFirst({
            where: {
              userId,
              status: "ACTIVE",
              expiresAt: {
                gt: new Date(),
              },
            },
            orderBy: {
              expiresAt: "desc",
            },
            select: {
              id: true,
              tier: true,
            },
          }),
          db.skinAnalysisCredit.findUnique({
            where: {
              userId,
            },
            select: {
              lastMembershipId: true,
            },
          }),
          db.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              name: true,
              phone: true,
            },
          }),
        ])
      : [null, null, null];
    const isUsingFreeCredit = access.canAnalyzeFree;
    const isUsingPaidCredit = !isUsingFreeCredit && access.paidCredits > 0;
    const timestamp = Date.now();
    const imageUrls = await Promise.all(
      imageDataArray.map(({ buffer, mimeType, angle }) =>
        uploadToSupabase(
          buffer,
          "selenite-skin-analysis",
          getImageUploadPath(imageHash, timestamp, angle),
          mimeType,
        ),
      ),
    );
    const analysis = await analyzeSkinImages(
      imageDataArray.map(({ base64, mimeType, label }) => ({
        base64,
        mimeType,
        label,
      })),
    );
    const clientName =
      clientProfile?.name || session?.user?.name || "Selenite Care Client";
    const pdfBuffer = await generateSkinAnalysisPdf(
      analysis,
      clientName,
      new Date(),
      imageHash,
    );
    const pdfUrl = await uploadToSupabase(
      pdfBuffer,
      "selenite-analysis-pdfs",
      getPdfUploadPath(imageHash, timestamp),
      "application/pdf",
    );
    const savedAnalysis = await db.skinAnalysis.create({
      data: {
        userId,
        imageUrl: imageUrls,
        imageHash,
        skinType: analysis.skinType,
        concerns: analysis.concerns,
        fullAnalysis: analysis.fullAnalysis,
        pdfUrl,
        isPaid: isUsingPaidCredit,
        paymentAmount: isUsingPaidCredit ? ANALYSIS_CREDIT_PRICE : null,
      },
      select: {
        id: true,
      },
    });

    if (userId) {
      if (isUsingFreeCredit) {
        const shouldResetFreeCredits =
          Boolean(activeMembership) &&
          activeMembership?.id !== creditRecord?.lastMembershipId;

        await db.skinAnalysisCredit.upsert({
          where: {
            userId,
          },
          update: {
            freeCreditsUsed: shouldResetFreeCredits
              ? 1
              : {
                  increment: 1,
                },
            lastMembershipId: activeMembership?.id ?? null,
            lastMembershipTier: activeMembership?.tier ?? null,
          },
          create: {
            userId,
            freeCreditsUsed: 1,
            lastMembershipId: activeMembership?.id ?? null,
            lastMembershipTier: activeMembership?.tier ?? null,
          },
        });
      } else if (isUsingPaidCredit) {
        await db.skinAnalysisCredit.update({
          where: {
            userId,
          },
          data: {
            paidCredits: {
              decrement: 1,
            },
          },
        });
      }
    }

    try {
      const staffUsers = await db.user.findMany({
        where: {
          role: {
            in: ["ADMIN", "CRM"],
          },
          isActive: true,
        },
        select: {
          id: true,
          role: true,
        },
      });
      const displayClient = userId ? clientName : "A visitor";
      const phoneText = clientProfile?.phone ? ` (${clientProfile.phone})` : "";
      const concernsText = analysis.concerns.slice(0, 2).join(", ") || "None";
      const message = `${displayClient}${phoneText} completed a skin analysis. Skin type: ${analysis.skinType}. Concerns: ${concernsText}.`;

      await Promise.all(
        staffUsers.map((staffUser) =>
          createNotification(
            staffUser.id,
            "New Skin Analysis Completed",
            message,
            NOTIFICATION_TYPES.INFO,
            staffUser.role === "CRM"
              ? "/crm/skin-analysis"
              : "/admin/skin-analysis",
          ),
        ),
      );
    } catch (notificationError) {
      console.error("Skin analysis staff notification failed:", notificationError);
    }

    return Response.json({
      cached: false,
      analysisId: savedAnalysis.id,
      skinType: analysis.skinType,
      concerns: analysis.concerns,
      fullAnalysis: analysis.fullAnalysis,
      summary: analysis.summary,
      consultationNote: analysis.consultationNote,
      pdfUrl,
    });
  } catch (error) {
    console.error("Skin analysis failed:", error);
    return Response.json(
      { error: "Unable to analyze skin image right now." },
      { status: 500 },
    );
  }
}
