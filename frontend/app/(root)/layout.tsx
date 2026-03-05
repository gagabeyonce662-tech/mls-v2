"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { CompareBar } from "@/components/listing/CompareBar";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CompareBar />
    </QueryClientProvider>
  );
};

export default Layout;
