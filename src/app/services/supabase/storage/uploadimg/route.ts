import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";


export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const form = await req.formData();
    const file = form.get("file") as File;
    const email = form.get("email") as string;

    const filename = file.name;

    const cleanEmail = email.trim().toLowerCase();

    if (!file) return NextResponse.json({ success: false, error: "Image Not Detected" }, { status: 404 });

    if (!cleanEmail) return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });

    const bucketName = "profile_pics";
    const filePath = `uploads/${cleanEmail}_${file.name}`;

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

    // If existing profile picture, delete old file from storage
    if (existingData) {
        const oldFilePath = existingData.file_link.split('/').slice(-2).join('/'); // Extract path from URL
        const { error: deleteError } = await supabaseServer.storage
            .from(bucketName)
            .remove([oldFilePath]);
        
        if (deleteError) {
            console.warn("Failed to delete old profile picture: ", deleteError);
            // Continue anyway - we'll update the record
        }
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
                return NextResponse.json({ success: false, error: "Failed to save image data" }, { status: 500 });
            }
            dbResult = insertData;
        }

        console.log("Upload successful: ", dbResult);

        return NextResponse.json({ 
            success: true, 
            message: existingData ? "Profile picture updated successfully" : "Profile picture uploaded successfully", 
            data: { publicUrl } 
        }, { status: 200 });

    }

}