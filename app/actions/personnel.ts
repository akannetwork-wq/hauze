'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';

async function getAuthenticatedClient() {
    const supabase = await createClient();
    const context = await getCurrentContext();
    if (!context) throw new Error('Tenant context not found');

    const { tenant } = context;

    return { supabase, tenant };
}

// --- Employees ---

export async function getEmployees() {
    try {
        const { supabase } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('employees')
            .select('*, personnel_balances(balance)')
            .order('first_name', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getEmployees Error:', error);
        return [];
    }
}

export async function getEmployee(id: string) {
    try {
        const { supabase } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('employees')
            .select('*, personnel_balances(balance)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getEmployee Error:', error);
        return null;
    }
}

export async function saveEmployee(employee: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Strip virtual/joined fields that aren't real columns
        const { id, personnel_balances, ...dbEmployee } = employee;

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
        const { data, error } = await supabase
            .from('personnel_transactions')
            .select('*')
            .eq('employee_id', employeeId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
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

        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('*, personnel_balances(balance)')
            .eq('is_active', true);

        if (empError) throw empError;

        let monthlyTotal = 0;
        let weeklyTotal = 0;

        // 1. Detect Monthly Salary Week
        // If today is within +/- 4 days of the payment day, or if we are in the first week and payment is early
        const isMonthlySalaryWeek = Math.abs(currentDay - config.salary_payment_day) <= 4 ||
            (config.salary_payment_day > 25 && currentDay < 5) ||
            (config.salary_payment_day < 5 && currentDay > 25);

        if (isMonthlySalaryWeek) {
            monthlyTotal = employees
                .filter(e => e.worker_type === 'monthly')
                .reduce((sum, e) => {
                    const balance = Number(e.personnel_balances?.[0]?.balance) || 0;
                    // For monthly workers, base_salary is their right, 
                    // and balance usually reflects advances (negative).
                    // Calculation: What we owe = Base + Balance (e.g. 30000 + -5000 = 25000)
                    const totalDue = (Number(e.base_salary) || 0) + balance;
                    return sum + (totalDue > 0 ? totalDue : 0);
                }, 0);
        }

        // 2. Weekly/Daily Workers (Pay what is owed now)
        // For yevmiyeli workers, we check if it is their payment day week (within 4 days)
        const isWeeklyPaymentWeek = Math.abs(currentDayOfWeek - config.weekly_payment_day) <= 4;

        if (isWeeklyPaymentWeek) {
            weeklyTotal = employees
                .filter(e => e.worker_type === 'daily')
                .reduce((sum, e) => {
                    const balance = Number(e.personnel_balances?.[0]?.balance) || 0;
                    return sum + (balance > 0 ? balance : 0); // Only positive balance (we owe them)
                }, 0);
        }

        return {
            isMonthlySalaryWeek,
            isWeeklyPaymentWeek,
            monthlyTotal,
            weeklyTotal,
            totalDueThisWeek: monthlyTotal + weeklyTotal,
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
            settings: { salary_payment_day: 5, weekly_payment_day: 5 }
        };
    }
}
