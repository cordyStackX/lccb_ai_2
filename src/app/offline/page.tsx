"use client";

export default function Offline() {

    return(
        <div style={{ 
            width: "100dvw", 
            height: "100dvh", 
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexFlow: "column",
            position: "fixed",
            top: "0", 
            left: "0",
            zIndex: "9999",
            background: "#0f4e82"
        }}>
            <img 
            src="/offline.png" 
            alt="Error"
            width={200} 
            height={220} 
            style={{ imageRendering: "crisp-edges" }}
            />
            <h2 style={{
                margin: "10px 0",
                fontSize: "clamp(1rem, 1vw + 1.3rem, 2rem)",
                color: "#fff"
            }} >No Internet Connections</h2>
        </div>
    );
}