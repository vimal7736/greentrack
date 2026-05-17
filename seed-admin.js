const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env");
  console.log("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedSuperAdmin() {
  const email = 'admin@greentrack.ai';
  const password = 'AdminPassword123!';

  console.log(`\n🚀 Starting database seeding for super admin: ${email}`);

  // 1. Create or find user in auth.users
  console.log("🔍 Checking if user exists in auth.users...");
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Error listing users:", listError.message);
    return;
  }

  let user = usersData.users.find(u => u.email === email);

  if (!user) {
    console.log("➕ User not found, creating new account...");
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Super Admin' }
    });

    if (createError) {
      console.error("❌ Error creating user:", createError.message);
      return;
    }
    user = createData.user;
    console.log(`✅ User created with ID: ${user.id}`);

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1500));
  } else {
    console.log(`ℹ️ User already exists with ID: ${user.id}`);

    // Update password to ensure it's known
    const { error: updatePassError } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (updatePassError) {
      console.warn("⚠️ Could not update password:", updatePassError.message);
    } else {
      console.log("✅ Password updated successfully.");
    }
  }

  // 2. Ensure a dedicated PLATFORM organisation exists for the super admin.
  // We never reuse a user org — the platform org is identified by name.
  const PLATFORM_ORG_NAME = 'GreenTrack Platform';
  console.log(`🔍 Looking for platform organisation '${PLATFORM_ORG_NAME}'...`);
  const { data: platformOrgs, error: platformOrgFetchError } = await supabase
    .from('organisations')
    .select('id')
    .eq('name', PLATFORM_ORG_NAME)
    .limit(1);

  if (platformOrgFetchError) {
    console.error("❌ Error fetching platform org:", platformOrgFetchError.message);
    return;
  }

  let orgId = platformOrgs?.[0]?.id;

  if (!orgId) {
    console.log(`➕ Platform org not found, creating '${PLATFORM_ORG_NAME}'...`);
    const { data: newOrg, error: orgInsertError } = await supabase
      .from('organisations')
      .insert({
        name: PLATFORM_ORG_NAME,
        slug: 'greentrack-platform',
        tier: 'business',
        seats_limit: 1000
      })
      .select()
      .single();

    if (orgInsertError) {
      console.error("❌ Error creating platform organisation:", orgInsertError.message);
      return;
    }
    orgId = newOrg.id;
    console.log(`✅ Platform organisation created with ID: ${orgId}`);
  } else {
    console.log(`ℹ️ Platform org already exists with ID: ${orgId}`);
  }

  // 3. Update or Insert profile
  console.log("👤 Syncing profile and setting 'admin' role...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
    console.error("❌ Error checking profile:", profileError.message);
  }

  if (!profile) {
    console.log("➕ Inserting new profile...");
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email,
        role: 'admin',
        full_name: 'Super Admin',
        org_id: orgId
      });

    if (insertError) {
      console.error("❌ Error inserting profile:", insertError.message);
    } else {
      console.log("✅ Profile created with 'admin' role.");
    }
  } else {
    console.log("🆙 Updating existing profile role...");
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        org_id: orgId // Move to dedicated platform org, away from user orgs
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("❌ Error updating profile:", updateError.message);
    } else {
      console.log("✅ Profile updated to 'admin'.");
    }
  }

  console.log("\n✨ === SEEDING COMPLETE === ✨");
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🏢 Org ID:   ${orgId}`);
  console.log("=============================\n");
}

seedSuperAdmin().catch(err => {
  console.error("💥 Fatal Error during seeding:", err);
  process.exit(1);
});

