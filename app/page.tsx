import Link from "next/link";
import { ArrowRight, BookOpen, Mic2, MonitorPlay } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ZONES = [
  {
    icon: BookOpen,
    name: "Study Pod — Small Room",
    description: "Cozy 5-seat pods with a work desk, chairs, and high-speed WiFi.",
  },
  {
    icon: MonitorPlay,
    name: "Smart Meeting — Medium Room",
    description: "10-seat meeting rooms with a writable Smart TV for workshops.",
  },
  {
    icon: Mic2,
    name: "Conference Suite — Large Room",
    description: "15-20 seat suites with a Smart TV, conference mics, and speakers.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <header className="border-b border-line bg-[var(--glass-bg-strong)] backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-linear-to-br from-accent to-accent2 text-onaccent font-heading text-sm font-bold">
              SS
            </div>
            <span className="font-heading text-sm font-semibold text-ink">Smart Space</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      <section className="container-x py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-block rounded-[var(--radius-full)] bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
            Space Rental & Creator Hub
          </span>
          <h1 className="font-heading text-5xl font-bold tracking-tight text-ink md:text-6xl">
            Book your space.
            <br />
            <span className="bg-linear-to-r from-accent-strong to-accent2-strong bg-clip-text text-transparent">
              Power your content.
            </span>
          </h1>
          <p className="mt-6 text-lg text-ink2">
            Smart Space is a high-tech co-working and content-creation facility for students and
            creators — with a marketing analytics platform built in to turn every booking into an
            insight.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login?as=customer">
                Book a space <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login?as=marketing">
                Marketing team login <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {ZONES.map((zone) => {
            const Icon = zone.icon;
            return (
              <Card key={zone.name} variant="glass">
                <CardContent>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-ink">{zone.name}</h3>
                  <p className="mt-1 text-sm text-ink2">{zone.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container-x pb-24">
        <Card variant="glass">
          <CardContent className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="mb-3 inline-block rounded-[var(--radius-full)] bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
                Marketing OS
              </span>
              <h2 className="font-heading text-2xl font-bold text-ink">
                Every booking becomes a marketing insight.
              </h2>
              <p className="mt-2 text-sm text-ink2">
                See the closed-loop engine behind Smart Space — how one booking flows through
                acquisition, conversion, service, and retention, and comes back as the next
                campaign. Available in English and Thai.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col lg:flex-row">
              <Button asChild variant="secondary" size="lg">
                <Link href="/martech">
                  See how the engine works <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/marketing-user">
                  Open the CDP dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
