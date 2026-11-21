import { Card, CardContent } from "@/components/ui/card";
import type { SiteStats } from "@/lib/stats";
import { formatCount } from "@/lib/format";

interface TileProps {
  label: string;
  value: string;
  caption: string;
}

function Tile({ label, value, caption }: TileProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

function plural(count: number, one: string, many: string): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/** Headline numbers for the whole dataset. */
export function StatsTiles({ stats }: { stats: SiteStats }) {
  const verifiedShare =
    stats.placeCount > 0
      ? Math.round((stats.verifiedPlaceCount / stats.placeCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Tile
        label="Places"
        value={formatCount(stats.placeCount)}
        caption={`across ${plural(stats.placeCategoryCount, "category", "categories")}`}
      />
      <Tile
        label="Cities"
        value={formatCount(stats.cityCount)}
        caption={`in ${plural(stats.countryCount, "country", "countries")}`}
      />
      <Tile
        label="Countries"
        value={formatCount(stats.countryCount)}
        caption="with at least one place"
      />
      <Tile
        label="Competitions"
        value={formatCount(stats.competitionCount)}
        caption={`across ${plural(stats.competitionCategoryCount, "category", "categories")}`}
      />
      <Tile
        label="Contributors"
        value={formatCount(stats.contributorCount)}
        caption="added at least one record"
      />
      <Tile
        label="Verified places"
        value={formatCount(stats.verifiedPlaceCount)}
        caption={`${verifiedShare}% of all places`}
      />
    </div>
  );
}
