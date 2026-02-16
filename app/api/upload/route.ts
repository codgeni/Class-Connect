import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Type de fichier non autorisé. Utilisez PDF, Word, PowerPoint, images ou texte.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (max 10 Mo).' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    const bucketPreferred = process.env.SUPABASE_BUCKET_FICHIERS || 'fichiers'
    const bucketFallback = process.env.SUPABASE_EVENTS_BUCKET || 'evenements'
    const safeName = file.name.slice(0, 50).replace(/[^a-zA-Z0-9._-]/g, '_')
    const context = formData.get('context') as string | null
    const folder = context === 'devoir' ? 'devoirs' : context === 'cours' ? 'cours' : 'soumissions'
    const filePath = `${folder}/${user.id}/${crypto.randomUUID()}-${safeName}`

    // En environnement Node (API Route), convertir en ArrayBuffer pour Supabase
    const body = file instanceof Blob ? await file.arrayBuffer() : file
    const contentType = file.type || 'application/octet-stream'

    const doUpload = (bucketName: string) =>
      supabase.storage.from(bucketName).upload(filePath, body, {
        contentType,
        upsert: false,
      })

    let bucket = bucketPreferred
    let { data, error } = await doUpload(bucket)

    // Si le bucket n'existe pas, tenter de le créer (public) puis réessayer
    if (error) {
      const msg = String((error as { message?: string }).message || '')
      const isBucketMissing =
        /bucket|not found|NotFound|BucketNotFound/i.test(msg) || (error as { error?: string }).error === 'BucketNotFound'
      if (isBucketMissing) {
        const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true })
        if (!createErr) {
          const retry = await doUpload(bucket)
          data = retry.data
          error = retry.error
        }
      }
    }

    // Fallback : essayer le bucket evenements (souvent déjà créé)
    if (error && bucket === bucketPreferred) {
      const fallback = await doUpload(bucketFallback)
      if (!fallback.error && fallback.data) {
        data = fallback.data
        error = null
        bucket = bucketFallback
      }
    }

    if (error || !data) {
      const message = (error as { message?: string })?.message || 'Erreur lors de l’upload. Vérifiez qu’un bucket Storage existe dans Supabase (ex. « fichiers » ou « evenements »).'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    const message = err?.message || 'Erreur serveur lors de l’upload'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
