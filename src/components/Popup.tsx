"use client";

import React from "react";

interface PopupProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Popup({ message, type = "info", onClose }: PopupProps) {
  // Determine icon, theme colors and border matching the premium aesthetic
  let icon = "ℹ️";
  let themeColor = "var(--primary-color)";
  let borderStyle = "1px solid #bfdbfe";

  if (type === "success") {
    icon = "✅";
    themeColor = "var(--success-color)";
    borderStyle = "1px solid #bbf7d0";
  } else if (type === "error") {
    icon = "⚠️";
    themeColor = "var(--error-color)";
    borderStyle = "1px solid #fca5a5";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "popupFadeIn 0.2s ease-out forwards",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: borderStyle,
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "28px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          animation: "popupScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          position: "relative",
          overflow: "hidden",
        }}
      >

        {/* Icon with scaling bounce animation */}
        <div
          style={{
            fontSize: "40px",
            marginBottom: "16px",
            display: "inline-block",
            animation: "popupBounce 0.5s ease-out",
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: "18px",
            fontWeight: "800",
            color: "var(--text-primary)",
            marginBottom: "8px",
            textTransform: "capitalize",
            letterSpacing: "-0.3px",
          }}
        >
          {type === "info" ? "Notification" : type}
        </h4>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: "1.6",
            marginBottom: "24px",
            fontWeight: "500",
          }}
        >
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: themeColor,
            color: "#ffffff",
            border: "none",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: "700",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: `0 4px 10px -2px ${themeColor}4d`,
            transition: "all 0.2s ease",
            outline: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 6px 14px -2px ${themeColor}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 10px -2px ${themeColor}4d`;
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Embedded CSS animations for visual excellence */}
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupScaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes popupBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
