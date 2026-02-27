"use client";

import React from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useProvince } from "@/contexts/ProvinceContext";
import { colors } from "@/config/design-system";

interface ProvinceSelectorProps {
    variant?: "desktop" | "mobile";
    isScrolled?: boolean;
}

export default function ProvinceSelector({
    variant = "desktop",
    isScrolled = false,
}: ProvinceSelectorProps) {
    const {
        selectedProvince,
        setSelectedProvince,
        getProvinceName,
        getAllProvinces,
    } = useProvince();

    if (variant === "mobile") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-white border-white/10 hover:bg-white/5"
                        style={{ backgroundColor: "transparent" }}
                    >
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-[#4C7DFF]" />
                            <span>{getProvinceName(selectedProvince)}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto bg-[#0C1536] border-white/10 text-white">
                    {getAllProvinces().map((province) => (
                        <DropdownMenuItem
                            key={province.code}
                            onClick={() => setSelectedProvince(province.code)}
                            className={`cursor-pointer focus:bg-white/5 focus:text-white ${selectedProvince === province.code
                                    ? "bg-white/10 text-[#4C7DFF] font-semibold"
                                    : ""
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4" />
                                <div>
                                    <div className="font-medium">{province.name}</div>
                                    <div className="text-xs opacity-60">{province.code}</div>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${isScrolled ? "text-white" : "text-white/80 hover:text-white"
                        }`}
                >
                    <MapPin className="w-3.5 h-3.5 text-[#4C7DFF]" />
                    <span>{selectedProvince}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-56 max-h-64 overflow-y-auto bg-[#0C1536] border-white/10 text-white"
            >
                {getAllProvinces().map((province) => (
                    <DropdownMenuItem
                        key={province.code}
                        onClick={() => setSelectedProvince(province.code)}
                        className={`cursor-pointer focus:bg-white/5 focus:text-white ${selectedProvince === province.code
                                ? "bg-white/10 text-[#4C7DFF] font-semibold"
                                : ""
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4" />
                            <div>
                                <div className="font-medium">{province.name}</div>
                                <div className="text-xs opacity-60">{province.code}</div>
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
