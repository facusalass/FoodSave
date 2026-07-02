import { supabase } from "../config/supabase.js";
const BUCKET = "offers";
export async function uploadImageController(request, response) {
    const file = request.file;
    if (!file) {
        response.status(400).json({
            success: false,
            error: { message: "No se recibió ninguna imagen." }
        });
        return;
    }
    const path = `${request.user.businessId}/${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (error) {
        response.status(500).json({
            success: false,
            error: { message: error.message }
        });
        return;
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    response.status(201).json({
        success: true,
        data: { url: urlData.publicUrl }
    });
}
