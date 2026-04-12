"use client";

import { colors } from "@/config/design-system";

interface FilterInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    prefix?: string;
    suffix?: string;
    disabled?: boolean;
}

export function FilterInput({
    label,
    placeholder,
    value,
    onChange,
    prefix,
    suffix,
    disabled,
}: FilterInputProps) {
    return (
        <div className="flex-1">
            <label
                className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: colors.body }}
            >
                {label}
            </label>
            <div className="relative">
                {prefix && (
                    <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium pointer-events-none"
                        style={{ color: colors.body }}
                    >
                        {prefix}
                    </span>
                )}
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
                    disabled={disabled}
                    className="w-full py-2.5 border rounded-lg text-[13px] transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        borderColor: colors.cardsBoarder,
                        color: colors.heading,
                        backgroundColor: colors.cards,
                        paddingLeft: prefix ? "24px" : "12px",
                        paddingRight: suffix ? "48px" : "12px",
                        // @ts-ignore
                        "--tw-ring-color": `${colors.primary}40`,
                    }}
                />
                {suffix && (
                    <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none"
                        style={{ color: colors.body }}
                    >
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}
