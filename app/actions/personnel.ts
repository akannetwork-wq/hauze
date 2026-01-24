'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


// --- Employees ---

export async function getEmployees(limit = 50, offset = 0) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data: employees, error } = await supabase
            .from('employees')
            .select('*, get_net_balance')
            .eq('tenant_id', tenant.id)
            .order('first_name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return (employees || []).map((e: any) => ({
            ...e,
            personnel_balances: [{ balance: e.get_net_balance || 0 }]
        }));

    } catch (error: any) {
        console.error('getEmployees Error:', error);
        return [];
    }
}

export async function getEmployee(id: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data: employee, error } = await supabase
            .from('employees')
            .select('*, get_net_balance')
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .single();

        if (error) throw error;

        return {
            ...employee,
            personnel_balances: [{ balance: employee.get_net_balance || 0 }]
        };
    } catch (error) {
        console.error('getEmployee Error:', error);
        return null;
    }
}



export async function saveEmployee(employee: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Strip virtual/joined fields that aren't real columns
        const { id, personnel_balances, get_net_balance, ...dbEmployee } = employee;

        const { data, error } = await supabase
            .from('employees')
            .upsert({
                ...dbEmployee,
                tenant_id: tenant.id,
                id: id || undefined,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/personnel');
        return { success: true, data };
    } catch (error: any) {
        console.error('saveEmployee Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Attendance & Puantaj ---

export async function getAttendance(options: { employeeId?: string, month?: string } = {}) {
    try {
        const { supabase } = await getAuthenticatedClient();
        let query = supabase.from('personnel_attendance').select('*, employees(first_name, last_name)');

        if (options.employeeId) query = query.eq('employee_id', options.employeeId);
        // month format: '2026-01'
        if (options.month) {
            const lastDay = new Date(parseInt(options.month.split('-')[0]), parseInt(options.month.split('-')[1]), 0).getDate();
            query = query.gte('date', `${options.month}-01`).lte('date', `${options.month}-${lastDay}`);
        }

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getAttendance Error:', error);
        return [];
    }
}

export async function saveAttendance(attendance: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Strip virtual/joined fields
        const { employees, ...dbAttendance } = attendance;

        const { data, error } = await supabase
            .from('personnel_attendance')
            .upsert({
                ...dbAttendance,
                tenant_id: tenant.id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'employee_id, date'
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/personnel/attendance');
        return { success: true, data };
    } catch (error: any) {
        console.error('saveAttendance Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAttendance(employeeId: string, date: string) {
    try {
        const { supabase } = await getAuthenticatedClient();

        // 1. Delete associated earning transaction if it exists (for daily workers)
        await supabase
            .from('personnel_transactions')
            .delete()
            .eq('employee_id', employeeId)
            .eq('date', date)
            .eq('description', `${date} Puantaj Hakedişi`);

        // 2. Delete attendance record
        const { error } = await supabase
            .from('personnel_attendance')
            .delete()
            .eq('employee_id', employeeId)
            .eq('date', date);

        if (error) throw error;

        revalidatePath('/admin/personnel/attendance');
        return { success: true };
    } catch (error: any) {
        console.error('deleteAttendance Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Financial Transactions (Borç/Alacak) ---

export async function getPersonnelLedger(employeeId: string) {
    try {
        const { supabase } = await getAuthenticatedClient();

        // 1. HR Transactions
        const { data: hrTx, error: hrError } = await supabase
            .from('personnel_transactions')
            .select('id, date, amount, type, description, created_at')
            .eq('employee_id', employeeId);

        if (hrError) throw hrError;

        // 2. Financial Transactions (Sales, Payments etc.)
        // We need to find the account(s) for this employee first
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id')
            .eq('employee_id', employeeId);

        let finTx: any[] = [];
        if (accounts && accounts.length > 0) {
            const accountIds = accounts.map(a => a.id);
            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('id, date, amount, type, description, created_at, document_type, document_id')
                .in('account_id', accountIds);

            if (txError) throw txError;
            finTx = txs || [];
        }

        // 3. Merge and Normalize
        // Since HR Ledger is the source of truth, we primarily show HR transactions.
        // We filter out Financial transactions that are already synced to HR (Orders/Payments)
        // to avoid visual duplication.
        const safeHrTx = (hrTx || []).map(t => ({
            ...t,
            source: 'hr',
        }));

        const safeFinTx = finTx
            .filter(t => {
                // Filter out synced items: Orders, Invoices, Purchases, and Payments
                // We assume these are synced to HR based on current logic.
                const isSyncedType = ['order', 'invoice', 'purchase', 'payment'].includes(t.document_type);
                return !isSyncedType;
            })
            .map(t => ({
                id: t.id,
                date: t.date,
                amount: t.amount,
                description: t.description,
                created_at: t.created_at,
                type: t.type === 'debit' ? 'advance' : 'payment', // Mapping for UI compatibility
                original_type: t.type,
                source: 'financial',
                document_type: t.document_type,
                document_id: t.document_id
            }));

        const allTx = [...safeHrTx, ...safeFinTx];

        // Sort by date desc
        return allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
        console.error('getPersonnelLedger Error:', error);
        return [];
    }
}

export async function addPersonnelTransaction(transaction: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data, error } = await supabase
            .from('personnel_transactions')
            .insert({
                ...transaction,
                tenant_id: tenant.id
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/personnel');
        return { success: true, data };
    } catch (error: any) {
        console.error('addPersonnelTransaction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePersonnelTransaction(id: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { error } = await supabase
            .from('personnel_transactions')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenant.id);

        if (error) throw error;

        revalidatePath('/admin/personnel');
        revalidatePath('/admin/personnel/finance');
        return { success: true };
    } catch (error: any) {
        console.error('deletePersonnelTransaction Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Tasks ---

export async function getPersonnelTasks(employeeId?: string) {
    try {
        const { supabase } = await getAuthenticatedClient();
        let query = supabase.from('personnel_tasks').select('*, employees(first_name, last_name)');

        if (employeeId) query = query.eq('assignee_id', employeeId);

        const { data, error } = await query.order('due_date', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getPersonnelTasks Error:', error);
        return [];
    }
}

export async function savePersonnelTask(task: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Strip virtual/joined fields
        const { id, employees, ...dbTask } = task;

        const { data, error } = await supabase
            .from('personnel_tasks')
            .upsert({
                ...dbTask,
                tenant_id: tenant.id,
                id: id || undefined,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/personnel');
        revalidatePath('/admin/personnel/tasks');
        return { success: true, data };
    } catch (error: any) {
        console.error('savePersonnelTask Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Salary Settings & Stats ---

export async function updatePersonnelSettings(settings: { salary_payment_day: number, weekly_payment_day: number }) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const newConfig = {
            ...(tenant.config || {}),
            personnel: {
                ...(tenant.config?.personnel || {}),
                ...settings
            }
        };

        const { error } = await supabase
            .from('tenants')
            .update({ config: newConfig })
            .eq('id', tenant.id);

        if (error) throw error;

        revalidatePath('/admin/personnel');
        return { success: true };
    } catch (error: any) {
        console.error('updatePersonnelSettings Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getSalaryStats() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const config = tenant.config?.personnel || { salary_payment_day: 5, weekly_payment_day: 5 }; // Default to 5th and Friday
        const today = new Date();
        const currentDay = today.getDate();
        const currentDayOfWeek = today.getDay(); // 0-6 (Sun-Sat)
        const currentMonth = today.toISOString().substring(0, 7); // YYYY-MM

        // Use get_net_balance() - View personnel_balances is DROPPED
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('*, get_net_balance')
            .eq('is_active', true);

        if (empError) throw empError;

        let monthlyTotal = 0;
        let weeklyTotal = 0;

        // 1. Detect Monthly Salary Week
        const isMonthlySalaryWeek = Math.abs(currentDay - config.salary_payment_day) <= 4 ||
            (config.salary_payment_day > 25 && currentDay < 5) ||
            (config.salary_payment_day < 5 && currentDay > 25);

        if (isMonthlySalaryWeek) {
            // Optimization: Fetch who has been accrued this month to avoid double counting
            const { data: accruedTx } = await supabase
                .from('personnel_transactions')
                .select('employee_id')
                .ilike('description', `%${currentMonth} Maaş Tahakkuku%`);

            const accruedEmployeeIds = new Set(accruedTx?.map(t => t.employee_id));

            // Fetch Financial Balances for unified net calc
            const { data: finBalances } = await supabase.from('account_with_balances').select('employee_id, balance').not('employee_id', 'is', null);

            monthlyTotal = employees
                .filter((e: any) => e.worker_type === 'monthly')
                .reduce((sum: number, e: any) => {
                    // Refined Unified Balance
                    const hrBal = Number(e.get_net_balance) || 0;
                    const finBal = Number(finBalances?.find(f => f.employee_id === e.id)?.balance) || 0;
                    const balance = hrBal - finBal;

                    const hasAccrued = accruedEmployeeIds.has(e.id);

                    let totalDue = balance;
                    if (!hasAccrued) {
                        totalDue += (Number(e.base_salary) || 0);
                    }

                    return sum + (totalDue > 0 ? totalDue : 0);
                }, 0);
        }

        // 2. Weekly/Daily Workers
        const isWeeklyPaymentWeek = Math.abs(currentDayOfWeek - config.weekly_payment_day) <= 4;

        if (isWeeklyPaymentWeek) {
            const { data: finBalances } = await supabase.from('account_with_balances').select('employee_id, balance').not('employee_id', 'is', null);

            weeklyTotal = employees
                .filter((e: any) => e.worker_type === 'daily')
                .reduce((sum: number, e: any) => {
                    const hrBal = Number(e.get_net_balance) || 0;
                    const finBal = Number(finBalances?.find(f => f.employee_id === e.id)?.balance) || 0;
                    const balance = hrBal - finBal;

                    return sum + (balance > 0 ? balance : 0);
                }, 0);
        }

        return {
            isMonthlySalaryWeek,
            isWeeklyPaymentWeek,
            monthlyTotal,
            weeklyTotal,
            totalDueThisWeek: monthlyTotal + weeklyTotal,
            activeEmployeeCount: employees?.length || 0,
            settings: config
        };
    } catch (error) {
        console.error('getSalaryStats Error:', error);
        return {
            isMonthlySalaryWeek: false,
            isWeeklyPaymentWeek: false,
            monthlyTotal: 0,
            weeklyTotal: 0,
            totalDueThisWeek: 0,
            activeEmployeeCount: 0,
            settings: { salary_payment_day: 5, weekly_payment_day: 5 }
        };
    }
}

// --- Salary Accrual ---

export async function accrueSalary(data: { employeeId: string, month: string, amount: number, description: string }) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Prevent Duplicates: Check if an accrual for this month already exists
        const monthPattern = data.month; // e.g., '2026-01'
        const { data: existing } = await supabase
            .from('personnel_transactions')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('employee_id', data.employeeId)
            .eq('type', 'earning')
            .ilike('description', `%${monthPattern}%`);

        if (existing && existing.length > 0) {
            return { success: false, error: `${data.month} dönemi için bu personelin maaş tahakkuku zaten yapılmış.` };
        }

        const { data: transaction, error } = await supabase
            .from('personnel_transactions')
            .insert({
                tenant_id: tenant.id,
                employee_id: data.employeeId,
                date: new Date().toISOString().split('T')[0],
                type: 'earning',
                amount: data.amount,
                description: data.description
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/personnel');
        revalidatePath('/admin/personnel/finance');
        return { success: true, data: transaction };
    } catch (error: any) {
        console.error('accrueSalary Error:', error);
        return { success: false, error: error.message };
    }
}

export async function accrueBulkSalaries(month: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Get all active monthly employees
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('id, base_salary, first_name, last_name')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .eq('worker_type', 'monthly');

        if (empError) throw empError;
        if (!employees || employees.length === 0) return { success: true, count: 0, message: 'Maaşlı çalışan bulunamadı.' };

        // 2. Filter out those who already have a "Maaş Tahakkuku" for this month
        // We use a broader pattern to catch all variations of "2026-01 Maaş Tahakkuku"
        const monthPattern = month;

        const { data: existingTx, error: txError } = await supabase
            .from('personnel_transactions')
            .select('employee_id')
            .eq('tenant_id', tenant.id)
            .eq('type', 'earning')
            .ilike('description', `%${monthPattern}%`);

        if (txError) throw txError;

        const alreadyAccruedIds = new Set(existingTx?.map(tx => tx.employee_id));

        const toAccrue = employees.filter(e => !alreadyAccruedIds.has(e.id));

        if (toAccrue.length === 0) {
            return { success: true, count: 0, message: 'Seçili ay için tüm personellerin maaşı zaten tahakkuk ettirilmiş.' };
        }

        // 3. Prepare inserts
        const descriptionPattern = `${month} Maaş Tahakkuku`;
        const inserts = toAccrue.map(emp => ({
            tenant_id: tenant.id,
            employee_id: emp.id,
            date: new Date().toISOString().split('T')[0],
            type: 'earning',
            amount: emp.base_salary,
            description: descriptionPattern
        }));

        const { error: insertError } = await supabase
            .from('personnel_transactions')
            .insert(inserts);

        if (insertError) throw insertError;

        revalidatePath('/admin/personnel');
        revalidatePath('/admin/personnel/finance');

        return { success: true, count: inserts.length, message: `${inserts.length} personelin maaşı tahakkuk ettirildi.` };
    } catch (error: any) {
        console.error('accrueBulkSalaries Error:', error);
        return { success: false, error: error.message };
    }
}
