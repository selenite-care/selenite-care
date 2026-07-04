import { v2 as cloudinary } from "cloudinary";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const { auth } = NextAuth(authConfig);

export const runtime = "nodejs";

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

async function uploadProductImageToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "selenite-care/product-images",
        resource_type: "image",
        transformation: [
          {
            width: 1200,
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
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
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
    const uploaded = await uploadProductImageToCloudinary(file);

    return Response.json({ secure_url: uploaded.secure_url });
  } catch (error) {
    console.error("Product image upload failed:", error);
    return Response.json({ error: "Failed to upload product image." }, { status: 500 });
  }
}
