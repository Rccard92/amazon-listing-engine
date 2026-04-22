import { redirect } from "next/navigation";

/** Percorso legacy (migliora da URL) rimosso dal MVP manuale-first: reindirizza al flusso principale. */
export default function ImproveLegacyRedirectPage() {
  redirect("/new-listing");
}
