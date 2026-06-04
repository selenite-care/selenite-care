import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json(
      { error: "Cloudinary environment variables are not configured." },
      { status: 500 },
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return null;
}

async function uploadToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "selenite-care/skin-images",
        resource_type: "image",
        transformation: [
          {
            width: 800,
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary did not return a secure URL."));
          return;
        }

        resolve({ secure_url: result.secure_url });
      },
    );

    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  const sessionError = await requireSession();

  if (sessionError) {
    return sessionError;
  }

  const configError = configureCloudinary();

  if (configError) {
    return configError;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "A file field is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  try {
    const uploaded = await uploadToCloudinary(file);

    return Response.json({ secure_url: uploaded.secure_url });
  } catch (error) {
    console.error("Skin image upload failed:", error);
    return Response.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
