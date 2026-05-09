import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QRCode } from 'https://esm.sh/qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QRResponse {
  created: boolean
  hash: string
  qr_url: string
  svg_storage_path: string
  png_storage_path: string
  svg_signed_url: string
  png_signed_url: string
}

function resolvePublicOrigin(): string {
  const raw =
    Deno.env.get('APP_PUBLIC_URL') ??
    Deno.env.get('NEXT_PUBLIC_APP_URL') ??
    'https://funcup.app'
  return raw.replace(/\/+$/, '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Valid session required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Valid session required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { batch_id } = await req.json()

    if (!batch_id) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'batch_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: batch, error: batchError } = await supabase
      .from('roast_batches')
      .select(`
        id,
        coffee_id,
        coffees!inner (
          id,
          roaster_id,
          roasters!inner (
            id,
            user_id,
            verification_status
          )
        )
      `)
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return new Response(
        JSON.stringify({ error: 'not_found', message: 'Batch not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const roaster = batch.coffees.roasters
    if (roaster.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'forbidden', message: 'You do not own this batch.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (roaster.verification_status !== 'verified') {
      return new Response(
        JSON.stringify({ error: 'forbidden', message: 'Roaster must be verified to generate QR codes.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingQr } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('batch_id', batch_id)
      .single()

    if (existingQr) {
      const { data: svgUrl } = supabase.storage.from('qr').getSignedUrl(existingQr.svg_storage_path, 3600)
      const { data: pngUrl } = supabase.storage.from('qr').getSignedUrl(existingQr.png_storage_path, 3600)

      const response: QRResponse = {
        created: false,
        hash: existingQr.hash,
        qr_url: existingQr.qr_url,
        svg_storage_path: existingQr.svg_storage_path,
        png_storage_path: existingQr.png_storage_path,
        svg_signed_url: svgUrl?.signedUrl || '',
        png_signed_url: pngUrl?.signedUrl || '',
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hash = crypto.randomUUID()
    const qrUrl = `${resolvePublicOrigin()}/q/${hash}`
    const svgStoragePath = `qr/${batch_id}/qr.svg`
    const pngStoragePath = `qr/${batch_id}/qr.png`

    const qrDataUri = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 1024,
      type: 'svg',
    })

    const svgContent = qrDataUri.replace('data:image/svg+xml;base64,', '')
    const svgDecoded = new TextDecoder().decode(Uint8Array.from(atob(svgContent), c => c.charCodeAt(0)))

    const { error: svgUploadError } = await supabase.storage
      .from('qr')
      .upload(svgStoragePath, svgDecoded, {
        contentType: 'image/svg+xml',
        upsert: true,
      })

    if (svgUploadError) {
      throw new Error(`Failed to upload SVG: ${svgUploadError.message}`)
    }

    const pngBase64 = qrDataUri.replace('data:image/svg+xml;base64,', '')
    const pngDecoded = new TextDecoder().decode(Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0)))

    const { error: pngUploadError } = await supabase.storage
      .from('qr')
      .upload(pngStoragePath, pngDecoded, {
        contentType: 'image/svg+xml',
        upsert: true,
      })

    if (pngUploadError) {
      throw new Error(`Failed to upload PNG: ${pngUploadError.message}`)
    }

    const { error: insertError } = await supabase
      .from('qr_codes')
      .insert({
        batch_id,
        hash,
        qr_url: qrUrl,
        svg_storage_path: svgStoragePath,
        png_storage_path: pngStoragePath,
      })

    if (insertError) {
      throw new Error(`Failed to insert QR code: ${insertError.message}`)
    }

    const { data: svgSigned } = supabase.storage.from('qr').getSignedUrl(svgStoragePath, 3600)
    const { data: pngSigned } = supabase.storage.from('qr').getSignedUrl(pngStoragePath, 3600)

    const response: QRResponse = {
      created: true,
      hash,
      qr_url: qrUrl,
      svg_storage_path: svgStoragePath,
      png_storage_path: pngStoragePath,
      svg_signed_url: svgSigned?.signedUrl || '',
      png_signed_url: pngSigned?.signedUrl || '',
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
