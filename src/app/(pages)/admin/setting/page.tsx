"use client";
import { Setting, Sidebar } from "@/components/admin";
import { useEffect, useState } from "react";

export default function ManageUserPage() {
    const [nav, setNav] = useState("");

    useEffect(() => {
        setNav("setting");
    }, [nav]);
    
    return (
        <main className="admin display_flex_center">
            <Sidebar nav={nav} />
            <Setting />
        </main>
    );
}