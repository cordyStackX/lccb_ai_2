import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const auth = await Security(req);
        if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const form = await req.formData();
        const file = form.get("file");
        const email = form.get("email");

        if (!(file instanceof File) || typeof email !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "The required data not met",
                },
                { status: 400 }
            );
        }

        const cleanEmail = email.trim().toLowerCase();

        const bucketName = "image";

        const extension = file.name.split(".").pop() || "jpg";

        const filePath = `uploads/${cleanEmail}.${extension}`;

        // Upload image to Supabase Storage
        const { error: uploadError } = await supabaseServer.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType: file.type || "image/jpeg",
                upsert: true,
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to upload image",
                },
                { status: 500 }
            );
        }

        // Get public image URL
        const { data: publicUrlData } = supabaseServer.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // Check existing user image
        const { data: existingData, error: existingError } =
            await supabaseServer
                .from("image_url")
                .select("id")
                .eq("email", cleanEmail)
                .maybeSingle();

        if (existingError) {
            console.error("Supabase Query Error:", existingError);

            return NextResponse.json(
                {
                    success: false,
                    error: "Database query failed",
                },
                { status: 500 }
            );
        }

        // Update existing row
        if (existingData) {
            const { error: updateError } = await supabaseServer
                .from("image_url")
                .update({
                    image_link: imageUrl,
                    image_name: "Captured_by " + cleanEmail
                })
                .eq("email", cleanEmail);

            if (updateError) {
                console.error("Supabase Update Error:", updateError);

                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to update image URL",
                    },
                    { status: 500 }
                );
            }
        }

        // Insert new row
        else {
            const { error: insertError } = await supabaseServer
                .from("image_url")
                .insert([
                    {
                        email: cleanEmail,
                        image_link: imageUrl,
                        image_name: "Captured_by " + cleanEmail
                    },
                ]);

            if (insertError) {
                console.error("Supabase Insert Error:", insertError);

                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to save image URL",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            {
                success: true,
                preview_url: imageUrl,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("Upload Route Error:", err);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}