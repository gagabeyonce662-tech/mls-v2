import Image from "next/image";
import { colors } from "@/config/design-system";

export default function AgentProfile() {
  return (
    <section className="py-16" style={{ backgroundColor: colors.cards }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2
              className="text-4xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              Gunneet Singh
            </h2>
            <p
              className="text-xl font-semibold mb-2"
              style={{ color: colors.icon }}
            >
              REALTOR®
            </p>
            <p className="text-lg mb-8" style={{ color: colors.body }}>
              TFN Realty
            </p>

            <div
              className="space-y-4 leading-relaxed"
              style={{ color: colors.body }}
            >
              <p>
                I am Gunneet Singh, an experienced real estate agent specialized
                in the Canadian market. My expertise lies specifically in the
                GTA real estate market. With a deep understanding of the local
                real estate landscape and a passion for helping clients achieve
                their goals, I am committed to providing exceptional service and
                expert guidance.
              </p>
              <p>
                Whether you&apos;re buying, selling, or investing in or outside
                the GTA, I offer personalized solutions tailored to your unique
                needs. My extensive knowledge of neighborhoods, market trends,
                and property values ensures that you make informed decisions
                every step of the way.
              </p>
              <p>
                Trust me to be your reliable partner in navigating the dynamic
                GTA real estate market. Let&apos;s work together to turn your
                real estate dreams into reality!
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=500&h=500"
                alt="Gunneet Singh - Real Estate Agent"
                width={400}
                height={400}
                className="rounded-full object-cover shadow-2xl"
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(to top right, ${colors.icon}33, ${colors.primary}33)`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
