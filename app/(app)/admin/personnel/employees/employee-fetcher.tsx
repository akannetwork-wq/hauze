import { getEmployees } from '@/app/actions/personnel';
import EmployeeListClient from './list-client';

export default async function EmployeeFetcher() {
    // Heavy DB Fetch
    const employees = await getEmployees();
    return <EmployeeListClient employees={employees} />;
}
