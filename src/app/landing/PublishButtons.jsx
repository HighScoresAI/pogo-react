import { useState } from "react";

export default function PublishButtons({ artifact }) {
    if (!artifact || artifact.status !== "Processed") return null;

    const [publishToChatbot, setPublishToChatbot] = useState(false);
    const [publishToBlog, setPublishToBlog] = useState(false);

    return (
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {/* Publish to Chatbot Button */}
            <button
                onClick={() => setPublishToChatbot((v) => !v)}
                style={{
                    background: publishToChatbot ? "#22c55e" : "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                }}
            >
                <img
                    src={publishToChatbot ? "/right.svg" : "/wrong.svg"}
                    alt={publishToChatbot ? "Selected" : "Not selected"}
                    style={{ width: 20, height: 20 }}
                />
                Publish to Chatbot
            </button>
            {/* Publish to Blog Button */}
            <button
                onClick={() => setPublishToBlog((v) => !v)}
                style={{
                    background: publishToBlog ? "#22c55e" : "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                }}
            >
                <img
                    src={publishToBlog ? "/right.svg" : "/wrong.svg"}
                    alt={publishToBlog ? "Selected" : "Not selected"}
                    style={{ width: 20, height: 20 }}
                />
                Publish to Blog
            </button>
        </div>
    );
}