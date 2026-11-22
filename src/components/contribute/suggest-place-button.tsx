"use client";

import * as React from "react";

import { SuggestPlaceDialog } from "@/components/map/suggest-place-dialog";
import { Button } from "@/components/ui/button";
import type { City } from "@/lib/types";

/** Opens the same no-account suggestion form the map uses. */
export function SuggestPlaceButton({ datasetCities }: { datasetCities: City[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Suggest a place</Button>
      <SuggestPlaceDialog
        datasetCities={datasetCities}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
