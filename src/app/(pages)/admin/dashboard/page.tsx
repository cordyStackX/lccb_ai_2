import { Dashboard, Options } from "@/components/admin";

export default function DashboardPage() {
    return (
        <main className="admin display_flex_center">
            <Options />
            <Dashboard />
        </main>
    );
}