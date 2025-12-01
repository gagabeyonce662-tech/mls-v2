import { colors } from '@/config/design-system';

export default function BuySellSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sell Section */}
          <div className="text-white p-12 rounded-lg text-center" style={{ background: `linear-gradient(to bottom right, ${colors.icon}, ${colors.primary})` }}>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              ARE YOU LOOKING TO
            </h2>
            <h3 className="text-3xl lg:text-4xl font-bold mb-6">
              SELL YOUR HOME ?
            </h3>
            <p className="text-lg mb-8 opacity-90">
              Selling your home shouldn't be stressful or take over your life.
              Let us handle the process for you, so you can focus on what matters to you the most.
            </p>
            <button className="px-8 py-3 rounded-lg font-semibold transition-colors duration-200" style={{ backgroundColor: colors.primary, color: colors.cards }}>
              HELP ME SELL
            </button>
          </div>

          {/* Buy Section */}
          <div className="text-white p-12 rounded-lg text-center" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.icon})` }}>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              MAKING MOVES TO
            </h2>
            <h3 className="text-3xl lg:text-4xl font-bold mb-6">
              BUY A HOME ?
            </h3>
            <p className="text-lg mb-8 opacity-90">
              With an amazing professional network, over years of experience and an in-depth 
              knowledge of the area, we will find your next home or condo quickly and for the best price.
            </p>
            <button className="px-8 py-3 rounded-lg font-semibold transition-colors duration-200" style={{ backgroundColor: colors.icon, color: colors.cards }}>
              HELP ME BUY
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}