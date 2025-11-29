"use client";

export default function MortgageCalculatorSection() {
  return (
    <div className="py-16 bg-gradient-to-br from-blue-900 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-ds-h2 leading-tight font-inter">
              Calculate Your Mortgage
              <br />
              Payments Easily
            </h2>
            <p className="text-ds-text-regular text-blue-100 font-inter">
              Use our mortgage calculator to estimate your monthly payments and find the perfect
              home within your budget.
            </p>
            <button className="bg-white text-ds-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors font-inter">
              Learn More
            </button>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80"
              alt="Modern House"
              className="rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
