import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { imageSize } from "image-size";
import { auth_jwt } from "@/firewall/jwt_auth";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = await req.formData();
    const file = form.get("file");
    const cleanEmail = auth.email.trim().toLowerCase();

    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "Image not detected" }, { status: 400 });

    const filename = file.name;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let dimensions: ReturnType<typeof imageSize>;
    try {
        dimensions = imageSize(fileBuffer);
    } catch {
        return NextResponse.json({ success: false, error: "The selected file is not a supported image" }, { status: 400 });
    }
    const { width, height } = dimensions;

    if (!width || !height || width < 256 || height < 256) {
        return NextResponse.json(
            { success: false, error: "Image must be at least 256x256 pixels" },
            { status: 400 }
        );
    }

    const bucketName = "profile_pics";
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "logo";
    const filePath = `uploads/${cleanEmail}/${crypto.randomUUID()}-${safeFilename}`;

    // Check if user already has a profile picture
    const { data: existingData, error: queryError } = await supabaseServer
    .from("profile_pic")
    .select("id, file_link, file_name")
    .eq("email", cleanEmail)
    .single();

    if (queryError && queryError.code !== "PGRST116") { // PGRST116 means no rows found
        console.error("Supabase Query Error: ", queryError);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
    .from(bucketName)
    .upload(filePath, file, {
        contentType: file.type,
        upsert: true // Overwrite if exists
    });

    if (uploadError) {
        console.error("Supabase Upload Error: ", uploadError);
        return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
    }

    if (uploadData) {
        
        // Get public URL
        const { data: publicUrlData } = supabaseServer.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        
        const publicUrl = publicUrlData.publicUrl;
        
        // Update or insert database record
        let dbResult;
        if (existingData) {
            // Update existing record
            const { data: updateData, error: updateError } = await supabaseServer
            .from("profile_pic")
            .update({ file_link: publicUrl, file_name: filename })
            .eq("email", cleanEmail);

            if (updateError) {
                console.error("Supabase Update Error: ", updateError);
                await supabaseServer.storage.from(bucketName).remove([filePath]);
                return NextResponse.json({ success: false, error: "Failed to update image data" }, { status: 500 });
            }
            dbResult = updateData;
        } else {
            // Insert new record
            const { data: insertData, error: insertError } = await supabaseServer
            .from("profile_pic")
            .insert([{ file_link: publicUrl, email: cleanEmail, file_name: filename }]);

            if (insertError) {
                console.error("Supabase Insert Error: ", insertError);
                await supabaseServer.storage.from(bucketName).remove([filePath]);
                return NextResponse.json({ success: false, error: "Failed to save image data" }, { status: 500 });
            }
            dbResult = insertData;
        }

        // Remove the previous image only after the new image and database row are saved.
        if (existingData?.file_link) {
            try {
                const oldUrl = new URL(existingData.file_link);
                const bucketMarker = `/storage/v1/object/public/${bucketName}/`;
                const markerIndex = oldUrl.pathname.indexOf(bucketMarker);
                if (markerIndex >= 0) {
                    const oldFilePath = decodeURIComponent(oldUrl.pathname.slice(markerIndex + bucketMarker.length));
                    if (oldFilePath && oldFilePath !== filePath) {
                        const { error: deleteError } = await supabaseServer.storage.from(bucketName).remove([oldFilePath]);
                        if (deleteError) console.warn("Failed to remove previous profile image:", deleteError);
                    }
                }
            } catch (error) {
                console.warn("Failed to parse previous profile image URL:", error);
            }
        }

        console.log("Upload successful: ", dbResult);

        await auth_jwt(cleanEmail);

        return NextResponse.json({ 
            success: true, 
            message: existingData ? "Profile picture updated successfully" : "Profile picture uploaded successfully", 
            data: { publicUrl } 
        }, { status: 200 });

    }

}
