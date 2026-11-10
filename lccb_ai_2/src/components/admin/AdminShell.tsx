"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import { Progress } from "@/utilities";

type AdminSession = { email: string; f_name: string };

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
    const session = useContext(AdminSessionContext);
    if (!session) throw new Error("useAdminSession must be used within the admin layout.");
    return session;
}

function getActiveNav(pathname: string) {
    const segments = pathname.split("/").filter(Boolean);
    const route = segments[segments.length - 1];
    return route === "manageuser" ? "manage_user" : route ?? "";
}

export default function AdminShell({ children, email, f_name }: AdminSession & { children: ReactNode }) {
    const pathname = usePathname();
    const nav = getActiveNav(pathname);

    useEffect(() => {
        Progress(false);
    }, [pathname]);

    return (
        <AdminSessionContext.Provider value={{ email, f_name }}>
            <main className="admin">
                <Sidebar nav={nav} />
                {children}
            </main>
        </AdminSessionContext.Provider>
    );
}
