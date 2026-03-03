"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { colors } from "@/config/design-system";
import { Calculator, DollarSign, Percent, Calendar, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function MortgageCalculatorPage() {
    const [homePrice, setHomePrice] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [interestRate, setInterestRate] = useState(5.5);
    const [loanTerm, setLoanTerm] = useState(25);
    const [propertyTax, setPropertyTax] = useState(2000);
    const [homeInsurance, setHomeInsurance] = useState(1000);
    const [monthlyPayment, setMonthlyPayment] = useState(0);

    useEffect(() => {
        const principal = homePrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;

        if (principal <= 0) {
            setMonthlyPayment(0);
            return;
        }

        if (monthlyRate === 0) {
            setMonthlyPayment(principal / numberOfPayments);
        } else {
            const x = Math.pow(1 + monthlyRate, numberOfPayments);
            const monthlyP = (principal * x * monthlyRate) / (x - 1);

            const monthlyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;

            setMonthlyPayment(monthlyP + monthlyTax + monthlyInsurance);
        }
    }, [homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-ds-card">
            <Header />

            <main className="pt-24 pb-20">
                <Container>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-ds-heading mb-4 font-inter">
                                Mortgage Calculator
                            </h1>
                            <p className="text-ds-body text-lg max-w-2xl mx-auto">
                                Plan your future with confidence. Estimate your monthly mortgage payments including taxes and insurance.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Inputs */}
                            <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-ds-card-border space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Home Price */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-ds-primary" />
                                            Home Price
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body">$</span>
                                            <input
                                                type="number"
                                                value={homePrice}
                                                onChange={(e) => setHomePrice(Number(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Down Payment */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <Percent className="w-4 h-4 text-ds-primary" />
                                            Down Payment
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body">$</span>
                                            <input
                                                type="number"
                                                value={downPayment}
                                                onChange={(e) => setDownPayment(Number(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Interest Rate */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <Percent className="w-4 h-4 text-ds-primary" />
                                            Interest Rate
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-body">%</span>
                                        </div>
                                    </div>

                                    {/* Loan Term */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-ds-primary" />
                                            Loan Term (Years)
                                        </label>
                                        <select
                                            value={loanTerm}
                                            onChange={(e) => setLoanTerm(Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all appearance-none bg-white"
                                        >
                                            <option value={15}>15 Years</option>
                                            <option value={20}>20 Years</option>
                                            <option value={25}>25 Years</option>
                                            <option value={30}>30 Years</option>
                                        </select>
                                    </div>

                                    {/* Property Tax */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-ds-primary" />
                                            Annual Property Tax
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body">$</span>
                                            <input
                                                type="number"
                                                value={propertyTax}
                                                onChange={(e) => setPropertyTax(Number(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Home Insurance */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-ds-heading flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-ds-primary" />
                                            Annual Home Insurance
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body">$</span>
                                            <input
                                                type="number"
                                                value={homeInsurance}
                                                onChange={(e) => setHomeInsurance(Number(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-ds-card-border focus:ring-2 focus:ring-ds-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-ds-card-border mt-6">
                                    <div className="flex items-start gap-3 p-4 bg-ds-card rounded-2xl">
                                        <Info className="w-5 h-5 text-ds-primary mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-ds-body leading-relaxed">
                                            This calculator is for estimation purposes only. Actual rates and fees may vary based on your credit score and other factors.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Result Card */}
                            <div className="bg-ds-primary rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
                                <div>
                                    <h3 className="text-xl font-semibold mb-8 opacity-80 flex items-center gap-2">
                                        <Calculator className="w-5 h-5" />
                                        Monthly Payment
                                    </h3>
                                    <div className="space-y-1">
                                        <div className="text-5xl font-bold font-inter tracking-tight">
                                            {formatCurrency(monthlyPayment)}
                                        </div>
                                        <p className="text-white/60 text-sm">per month</p>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                                        <span className="text-white/70">Principal & Interest</span>
                                        <span className="font-semibold">{formatCurrency(monthlyPayment - (propertyTax + homeInsurance) / 12)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                                        <span className="text-white/70">Taxes & Insurance</span>
                                        <span className="font-semibold">{formatCurrency((propertyTax + homeInsurance) / 12)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-white/70">Total Principal</span>
                                        <span className="font-semibold">{formatCurrency(homePrice - downPayment)}</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full mt-8 py-4 bg-white text-ds-primary rounded-2xl font-bold hover:bg-ds-card transition-colors shadow-lg"
                                    onClick={() => window.print()}
                                >
                                    Download Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </Container>
            </main>

            <Footer />
        </div>
    );
}
