import Link from "next/link";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors } from "@/config/design-system";

export default function MortgageCalculator() {
  return (
    <section
      className="py-16 text-white"
      style={{
        background: `linear-gradient(to right, ${colors.icon}, ${colors.primary})`,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Calculate Your Mortgage Payments Easily
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Easily calculate your mortgage payments and determine your
              affordability with our user-friendly Mortgage Calculator. Input
              your loan details to see how different scenarios affect your
              monthly budget.
            </p>
          </div>

          <div className="text-center lg:text-right">
            <Button
              asChild
              className="px-8 py-4 text-lg font-semibold"
              style={{ backgroundColor: colors.primary, color: colors.cards }}
            >
              <Link href="/mortgage-calculator">
                <Calculator className="w-5 h-5 mr-2" />
                CALCULATE NOW
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
