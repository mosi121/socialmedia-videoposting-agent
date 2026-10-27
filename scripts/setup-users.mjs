import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const authorizedUsers = [
  {
    email: 'amorousbrood@gmail.com',
    password: '0304880mM@',
    name: 'Amorous Brood',
    role: 'creator',
  },
  {
    email: 'fatimamohsinkhokhar29@gmail.com',
    password: '0304880mM@',
    name: 'Fatima Mohsin Khokhar',
    role: 'creator',
  },
];

async function setupUsers() {
  console.log('Registering authorized users in Supabase Auth...');

  for (const u of authorizedUsers) {
    try {
      // 1. Check if user already exists
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

      if (existing) {
        console.log(`User ${u.email} already exists. Updating password...`);
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: u.password,
          user_metadata: { full_name: u.name, role: u.role },
          email_confirm: true,
        });
        console.log(`Updated ${u.email}`);
      } else {
        console.log(`Creating user ${u.email}...`);
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, role: u.role },
        });

        if (error) {
          console.error(`Failed to create ${u.email}:`, error.message);
        } else {
          console.log(`Successfully created user: ${u.email} (ID: ${data.user.id})`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${u.email}:`, err);
    }
  }
}

setupUsers();
