"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { ApprovedTool } from "@/types/catalogue";

function getLogoUrl(vendorUrl: string | null): string | null {
  if (!vendorUrl) return null;
  try {
    const { hostname } = new URL(vendorUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

function ToolLogo({ url }: { url: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={32}
      height={32}
      className="rounded-md object-contain"
    />
  );
}

export default function CataloguePage() {
  const [tools, setTools] = useState<ApprovedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/catalogue")
      .then((r) => r.json())
      .then((data: ApprovedTool[]) => {
        setTools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(tools.map((t) => t.category))).sort()];

  const filtered = tools.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Approved AI Tools</h1>
          <p className="text-muted-foreground">
            These tools have been reviewed and approved for use. Request access in seconds — no full AI review needed.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search tools…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9"
          />
          <div className="flex flex-wrap gap-2">
            {!loading &&
              categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {cat === "all" ? "All categories" : cat}
                </button>
              ))}
          </div>
        </div>

        {/* Tool grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                {tools.length === 0
                  ? "No approved tools in the catalogue yet."
                  : "No tools match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => {
              const logoUrl = getLogoUrl(tool.vendor_url);
              return (
                <Card
                  key={tool.id}
                  className="rounded-xl flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.015] transition-all duration-200"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {logoUrl && <ToolLogo url={logoUrl} />}
                        <CardTitle className="text-base leading-snug">{tool.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {tool.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-4 pt-0">
                    <p className="text-sm text-muted-foreground flex-1">{tool.description}</p>
                    <div className="flex items-center gap-2">
                      {tool.vendor_url && (
                        <a
                          href={tool.vendor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Vendor site ↗
                        </a>
                      )}
                      <div className="flex-1" />
                      <Link href={`/catalogue/${tool.id}/request`}>
                        <Button size="sm">Request Access</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t see what you need?{" "}
            <Link href="/submit" className="text-primary hover:underline">
              Submit a full AI review request
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
