import { redirect } from "next/navigation";

/** Percorso legacy (URL competitor) rimosso dal MVP manuale-first: reindirizza al flusso principale. */
export default function CompetitorLegacyRedirectPage() {
  redirect("/new-listing");
}
