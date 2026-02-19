import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller is a corretora
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "corretora") {
      return new Response(JSON.stringify({ error: "Apenas corretoras podem criar contas de empresa" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { empresa_id, cnpj } = await req.json();

    if (!empresa_id || !cnpj) {
      return new Response(JSON.stringify({ error: "empresa_id e cnpj são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get empresa data
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .select("*")
      .eq("id", empresa_id)
      .single();

    if (empresaError || !empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if a profile already exists for this empresa
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("empresa_id", empresa_id)
      .eq("role", "empresa")
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Conta já existe para esta empresa",
        already_exists: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Password = first 4 digits of CNPJ
    const cnpjDigits = cnpj.replace(/\D/g, "");
    const password = cnpjDigits.substring(0, 4);

    if (password.length < 4) {
      return new Response(JSON.stringify({ error: "CNPJ inválido para gerar senha" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if auth user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === empresa.email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`Auth user already exists for email ${empresa.email}, linking profile`);
    } else {
      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: empresa.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome: empresa.nome,
          role: "empresa",
        },
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
        return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
    }

    // Check if profile exists for this user
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userProfile) {
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email: empresa.email,
          nome: empresa.nome,
          role: "empresa",
          empresa_id: empresa_id,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return new Response(JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Update existing profile to link to empresa
      await supabaseAdmin
        .from("profiles")
        .update({ empresa_id: empresa_id, role: "empresa" })
        .eq("id", userId);
    }

    console.log(`Account created for empresa ${empresa.nome} (${empresa.email}) with password: first 4 digits of CNPJ ${cnpjDigits.substring(0, 4)}****`);

    return new Response(JSON.stringify({
      success: true,
      message: `Conta criada com sucesso. Email: ${empresa.email}, Senha: ${password}`,
      email: empresa.email,
      password_hint: `Primeiros 4 dígitos do CNPJ (${password})`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
