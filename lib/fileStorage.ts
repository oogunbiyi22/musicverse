import { supabase } from "@/utils/supabase"

export async function uploadFile(userId: string, file: File) {
  try {
    // Create a unique file path using userId and timestamp
    const filePath = `${userId}/${Date.now()}_${file.name}`

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from("user_uploads")
      .upload(filePath, file)

    if (error) throw error

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("user_uploads")
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteFile(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from("user_uploads")
      .remove([filePath])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}