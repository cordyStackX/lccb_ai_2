"use client";
import styles from "./css/styles.module.css";
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";

export default function Main() {
    const [messages, setMessages] = useState<
        { ask: string; respond: string }[]
    >([]);
    const [chatres, setChatres] = useState({
        ask: "", respond2: ""
    });
    const [status, setStatus] = useState(false);
    // const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatres({ ...chatres, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!chatres) return; 
        setStatus(true);
        const newMessage = {
            ask: chatres.ask,
            respond: "# Hello World" 
        };
        setMessages((prev) => [...prev, newMessage]);
        setChatres({ ask: "", respond2: "" }); 
    };


    return(
        <section className={`${styles.container} display_flex_center_column`}>
            <section className={`${styles.header} display_flex_center`}>
                    <h2>Laco AI</h2>
            </section>
            
               {status ?(
                <section className={styles.chat}>
                    <div className="display_flex_center_column">
                    {messages.map((msg, index) => (
                        <div key={index} className={`${styles.response}`}>
                            <div className={`${styles.user_respones} display_flex_center`}>
                                <div>
                                    <p>{msg.ask}</p>
                                </div>
                            </div>
                            <div className={`${styles.ai_response} display_flex_center`}>
                                <Markdown>{msg.respond}</Markdown>
                            </div>
                        </div>
                    ))}
                    </div>
                    <div ref={chatEndRef} />
                </section>
               ) : (
                    
                    <h1>Ask Anything or Upload your PDF file</h1>
                    
               )}
            
            <form className={`${styles.ask} display_flex_center`} onSubmit={handleSubmit}>
                <span>+</span>
                <input 
                type="text" 
                id="chat" 
                placeholder="Ask anything" 
                name="ask"
                value={chatres.ask} 
                onChange={handleChange}
                autoComplete="off"
                spellCheck={false}
                />
                <button>Ask</button>
            </form>
        </section>
    );
}