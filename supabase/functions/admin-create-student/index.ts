import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authorization = request.headers.get('Authorization') || ''
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', caller.id)
    .maybeSingle()
  if (!callerProfile?.is_admin) return Response.json({ error: 'Admin access required' }, { status: 403, headers: corsHeaders })

  const body = await request.json()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  const phone = String(body.phone || '').trim()
  const courseIds = Array.isArray(body.courseIds) ? body.courseIds.filter((id: unknown) => typeof id === 'string') : []
  if (!email || !password || password.length < 6 || !fullName || !courseIds.length) {
    return Response.json({ error: 'Nom, email, mot de passe (6 caractères minimum) et au moins un cours sont requis.' }, { status: 400, headers: corsHeaders })
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  })
  if (createError || !created.user) return Response.json({ error: createError?.message || 'Unable to create user' }, { status: 400, headers: corsHeaders })

  const studentId = created.user.id
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: studentId,
    email,
    full_name: fullName,
    phone,
    is_admin: false,
    updated_at: new Date().toISOString(),
  })
  if (profileError) return Response.json({ error: profileError.message }, { status: 500, headers: corsHeaders })

  const { error: assignmentError } = await adminClient.from('student_courses').upsert(
    courseIds.map((courseId: string) => ({ student_id: studentId, course_id: courseId, granted_by: caller.id, status: 'Actif' })),
    { onConflict: 'student_id,course_id' },
  )
  if (assignmentError) return Response.json({ error: assignmentError.message }, { status: 500, headers: corsHeaders })

  return Response.json({ id: studentId, email }, { headers: corsHeaders })
})
