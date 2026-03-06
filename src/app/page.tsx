import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl overflow-hidden inline-block">
              <Image
                src="/logo.png"
                alt="Immediate, a Burda company"
                width={320}
                height={88}
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Request access to an AI tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Submit your request and a team of AI agents will review it from security, legal,
            engineering, and business perspectives — delivering a structured recommendation to IT/Infosec.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-2 border-green-200 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.015] transition-all duration-200">
            <CardContent className="pt-6 pb-6 flex flex-col gap-4 flex-1">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Fast track</div>
                <h2 className="text-lg font-semibold">Browse Approved Tools</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fast-track access for tools already reviewed and approved by IT.
                </p>
              </div>
              <div className="mt-auto">
                <Link href="/catalogue">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">Browse Catalogue</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.015] transition-all duration-200">
            <CardContent className="pt-6 pb-6 flex flex-col gap-4 flex-1">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Full AI review</div>
                <h2 className="text-lg font-semibold">Request a New Tool</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit for a full multi-agent review — security, legal, engineering, and business perspectives.
                </p>
              </div>
              <div className="mt-auto">
                <Link href="/submit">
                  <Button size="lg" className="w-full">Get Started</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">5</div>
              <div className="text-xs text-muted-foreground">AI Reviewers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">4</div>
              <div className="text-xs text-muted-foreground">Review Phases</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">&lt;2m</div>
              <div className="text-xs text-muted-foreground">Decision Read Time</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            IT/Infosec reviewer?{" "}
            <Link href="/requests" className="text-primary hover:underline">
              Open the dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
