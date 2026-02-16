import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const bucket = process.env.SUPABASE_EVENTS_BUCKET || 'evenements'
    const ext = file.name.split('.').pop()
    const filePath = `dates-importantes/${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Erreur lors de l’upload' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur serveur lors de l’upload' }, { status: 500 })
  }
}

