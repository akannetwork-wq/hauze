
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('--- LATEST ORDER ---');
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (orderError) console.error(orderError);
    else console.log(JSON.stringify(orders?.[0], null, 2));

    console.log('\n--- EMPLOYEE ACCOUNT ---');
    const empId = orders?.[0]?.employee_id;
    if (empId) {
        const { data: acc, error: accError } = await supabase
            .from('accounts')
            .select('*')
            .eq('employee_id', empId);

        if (accError) console.error(accError);
        else console.log(JSON.stringify(acc, null, 2));
    }

    console.log('\n--- LATEST PERSONNEL TRANSACTION ---');
    const { data: tx, error: txError } = await supabase
        .from('personnel_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (txError) console.error(txError);
    else console.log(JSON.stringify(tx?.[0], null, 2));
}

checkState();
