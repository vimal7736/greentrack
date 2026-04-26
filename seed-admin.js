const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedSuperAdmin() {
  const email = 'admin@greentrack.ai';
  const password = 'test123456';
  
  console.log(`Seeding super admin with email: ${email}`);

  // 1. Create or find user in auth.users
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  let user = usersData.users.find(u => u.email === email);
  
  if (!user) {
    console.log("User not found in auth.users, creating...");
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }
    user = createData.user;
    console.log("User created with ID:", user.id);
    
    // Wait a bit for the trigger to create the profile if there is one
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log("User already exists with ID:", user.id);
    
    // Update password just in case
    await supabase.auth.admin.updateUserById(user.id, { password });
  }

  // 2. Update role in profiles table
  console.log("Updating profile role to 'superadmin'...");
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'superadmin' })
    .eq('id', user.id);

  if (updateError) {
    console.error("Error updating profile role:", updateError);
    // If the profile doesn't exist, we might need to insert it
    console.log("Attempting to insert profile manually...");
    
    // Check if an org exists, if not create one
    const { data: orgs } = await supabase.from('organisations').select('id').limit(1);
    let orgId = orgs?.[0]?.id;
    
    if (!orgId) {
        const { data: newOrg } = await supabase.from('organisations').insert({ name: 'Admin Org', tier: 'business' }).select().single();
        orgId = newOrg?.id;
    }
    
    const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email, role: 'superadmin', full_name: 'Super Admin', org_id: orgId });
        
    if (insertError) {
        console.error("Error inserting profile:", insertError);
    } else {
        console.log("Profile inserted successfully.");
    }
  } else {
    console.log("Profile role updated successfully.");
  }
  
  console.log("\n=== SEED COMPLETE ===");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

seedSuperAdmin().catch(console.error);
