"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Property } from "@/lib/api";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";

interface QuickViewContextType {
    selectedProperty: Property | null;
    isOpen: boolean;
    openQuickView: (property: Property) => void;
    closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: ReactNode }) {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const openQuickView = (property: Property) => {
        setSelectedProperty(property);
        setIsOpen(true);
    };

    const closeQuickView = () => {
        setIsOpen(false);
    };

    return (
        <QuickViewContext.Provider value={{ selectedProperty, isOpen, openQuickView, closeQuickView }}>
            {children}
            <PropertyQuickViewModal
                show={isOpen}
                property={selectedProperty}
                onClose={closeQuickView}
            />
        </QuickViewContext.Provider>
    );
}

export function useQuickView() {
    const context = useContext(QuickViewContext);
    if (context === undefined) {
        throw new Error("useQuickView must be used within a QuickViewProvider");
    }
    return context;
}
