import { getEmployees, getAttendance } from '@/app/actions/personnel';
import AttendanceGridClient from './grid-client';

export default async function AttendanceFetcher({ month }: { month: string }) {
    const [employees, attendance] = await Promise.all([
        getEmployees(),
        getAttendance({ month })
    ]);

    return (
        <AttendanceGridClient
            employees={employees}
            initialAttendance={attendance}
            month={month}
        />
    );
}
