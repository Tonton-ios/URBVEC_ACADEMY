
const SUPABASE_URL = 'https://woeqowsijbtljifvgcfu.supabase.co/rest/v1/'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZXFvd3NpamJ0bGppZnZnY2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDIxODMsImV4cCI6MjA5NzMxODE4M30.4_AMO599tWy1PiJ3dfGgR_GDyo6Yth38Vg70wNLgjQ8'; 

export const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', supabase);