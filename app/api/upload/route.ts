import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Iniciando upload...')
    console.log('Config:', {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    console.log('📁 File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Convertir el archivo a base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`

    // Determinar el tipo de recurso
    const resourceType = file.type.startsWith('image/') ? 'image' : 'raw'

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      folder: 'gastos-app',
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp'],
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
    })
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error)
    return NextResponse.json(
      { error: 'Error al subir el archivo', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { publicId, resourceType } = await request.json()
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'No se proporcionó publicId' },
        { status: 400 }
      )
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el archivo', details: error.message },
      { status: 500 }
    )
  }
}