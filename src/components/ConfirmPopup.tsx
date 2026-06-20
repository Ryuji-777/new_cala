"use client";

import React from "react";

interface ConfirmPopupProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmPopup({
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
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
          border: "1px solid #e2e8f0",
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
        {/* Title */}
        <h4
          style={{
            fontSize: "18px",
            fontWeight: "800",
            color: "var(--text-primary, #0f172a)",
            marginBottom: "12px",
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h4>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary, #475569)",
            lineHeight: "1.6",
            marginBottom: "28px",
            fontWeight: "500",
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              backgroundColor: "#ffffff",
              color: "var(--text-secondary, #475569)",
              border: "1px solid #cbd5e1",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "50px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: "var(--primary-color, #2563eb)",
              color: "#ffffff",
              border: "none",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 4px 10px -2px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 14px -2px rgba(37, 99, 235, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 10px -2px rgba(37, 99, 235, 0.3)";
            }}
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupScaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
