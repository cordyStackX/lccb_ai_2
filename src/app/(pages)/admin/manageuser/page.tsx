"use client";
import { ManageUser, Sidebar } from "@/components/admin";
import { useEffect, useState } from "react";

export default function ManageUserPage() {
    const [nav, setNav] = useState("");

    useEffect(() => {
        setNav("manage_user");
    }, [nav]);
    
    return (
        <main className="admin display_flex_center">
            <Sidebar nav={nav} />
            <ManageUser />
        </main>
    );
}