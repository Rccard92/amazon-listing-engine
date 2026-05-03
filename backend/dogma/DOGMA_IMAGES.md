# DOGMA IMAGES

## Destinatario

- Il brief e indirizzato al designer grafico. Usare imperativi chiari e specifiche tecniche.

## Struttura gallery Amazon

- La gallery si compone di esattamente 8 immagini numerate da 1 a 8. Ogni immagine ha un solo ruolo narrativo.

## Specifiche comuni (una sola volta)

- MUST: riepilogare in un unico blocco `common_specs` (o equivalente nel JSON) canvas, formato, formato file e vincoli che valgono per tutta la gallery.
- MUST NOT: ripetere per ogni slot 2-8 le stesse righe di dimensione/formato JPEG se gia coperte in `common_specs`.

## IMAGE 1 Main image

- Scopo: immagine principale ufficiale Amazon.
- Presentazione prodotto pulita.
- MUST: sfondo bianco puro RGB 255 255 255 o equivalente conforme policy.
- MUST: solo il prodotto incluso nella vendita, nessun accessorio non in bundle se non dichiarato nei dati.
- MUST NOT: overlay di testo, icone, badge, elementi decorativi, scene lifestyle.
- MUST: il prodotto occupa la maggior parte del frame, centrato e leggibile.
- Includere in `common_specs` il canvas consigliato: 2000 x 2000 px, rapporto 1:1, JPEG ad alta risoluzione.
- Per il campo messaggio breve in grafica dell immagine 1: valore letterale `Nessuno` (nessun testo in grafica sulla main).

## IMAGE 2 Problema e soluzione

- Mostrare il problema principale del cliente e come il prodotto lo risolve.
- Non inventare problemi non supportati dal brief.

## IMAGE 3 Utilizzo reale

- Contesto d uso realistico e credibile coerente con categoria e target.

## IMAGE 4 Specifiche tecniche

- Dettagli tecnici rilevanti: misure, componenti, materiali, funzioni. Solo dati presenti nel brief o nelle specifiche.

## IMAGE 5 Differenziazione

- Cosa rende il prodotto piu utile o distintivo rispetto a alternative generiche, senza nominare marchi competitor.

## IMAGE 6 Dettagli qualita

- Close-up materiali, finiture, costruzione. Evidenze visive coerenti con i dati.

## IMAGE 7 Fiducia sicurezza chiarezza

- Ridurre dubbi e obiezioni: sicurezza, uso, manutenzione, compatibilita, affidabilita.
- MUST NOT: inventare garanzie, certificazioni CE o normative se non presenti nei dati.

## IMAGE 8 Valore aggiunto bundle confezione

- Cosa e incluso, accessori, bundle, packaging, valore aggiunto.
- MUST: menzionare solo elementi effettivamente presenti nei dati prodotto.

## Campi per ogni immagine nel brief (JSON)

- title, role, visual_instructions, short_message, communication_angle, designer_instructions, mistakes_to_avoid, product_data_to_highlight.
- NON duplicare in ogni immagine le stesse specifiche di canvas gia in `common_specs`.

## Cosa non deve mai comparire

- Dati non verificati, promesse assolute, confronti aggressivi con marchi terzi.
- Testo microscopico o sovraccarico di claim su immagini non main.

## Supporto conversione

- Le immagini riducono attriti e dubbi, non sostituiscono informazioni inventate.
