"use client";

import { Component, type ReactNode } from "react";
import { getStrings } from "@/constants/strings";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const strings = getStrings();
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: "var(--color-bg-primary)" }}
        >
          <div className="text-center max-w-sm">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--color-bg-tertiary)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-warning)" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              {strings.errorGeneric}
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {strings.errorLoadFailed}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 rounded-lg text-sm font-medium cursor-pointer"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg-primary)",
              }}
            >
              {strings.errorRefresh}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
