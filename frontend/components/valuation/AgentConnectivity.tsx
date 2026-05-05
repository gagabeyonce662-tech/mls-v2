"use client";

import { Phone, Mail, UserCircle2 } from "lucide-react";
import { colors } from "@/config/design-system";

export type AgentCard = {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo_url: string;
  brokerage: string;
  bio: string;
};

type Props = {
  agent: AgentCard | null;
  /** Right column: consultation form slot */
  children?: React.ReactNode;
};

export function AgentConnectivity({ agent, children }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
      <div
        className="rounded-3xl p-8 md:p-10 border shadow-xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.97)",
          borderColor: colors.cardsBoarder,
        }}
      >
        <h3 className="text-xl font-bold mb-2" style={{ color: colors.heading }}>
          Talk to a local agent
        </h3>
        {agent ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4">
              {agent.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agent.photo_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border"
                  style={{ borderColor: colors.cardsBoarder }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}12` }}
                >
                  <UserCircle2 className="w-10 h-10" style={{ color: colors.primary }} />
                </div>
              )}
              <div>
                <p className="font-bold text-lg" style={{ color: colors.heading }}>
                  {agent.name}
                </p>
                {agent.brokerage ? (
                  <p className="text-sm" style={{ color: colors.body }}>
                    {agent.brokerage}
                  </p>
                ) : null}
              </div>
            </div>
            {agent.bio ? (
              <p className="text-sm leading-relaxed" style={{ color: colors.body }}>
                {agent.bio}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 text-sm">
              {agent.phone ? (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-2 font-medium"
                  style={{ color: colors.primary }}
                >
                  <Phone className="w-4 h-4" />
                  {agent.phone}
                </a>
              ) : null}
              {agent.email ? (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-2 font-medium"
                  style={{ color: colors.primary }}
                >
                  <Mail className="w-4 h-4" />
                  {agent.email}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className="mt-6 p-5 rounded-2xl border"
            style={{
              backgroundColor: `${colors.primary}06`,
              borderColor: colors.cardsBoarder,
            }}
          >
            <p className="font-semibold" style={{ color: colors.heading }}>
              No agent assigned for this area yet
            </p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: colors.body }}>
              We don&apos;t have a HouseSigma-style area specialist on file for this
              postal code or city. Leave your details in the form — we&apos;ll route
              you to the right person.
            </p>
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
