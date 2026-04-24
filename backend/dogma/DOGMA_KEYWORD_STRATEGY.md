# DOGMA KEYWORD STRATEGY

## Distinzione operativa

- **Keyword planning (pre-content)**: decide allocazione semantica tra frontend e backend.
- **Backend final terms (post-content)**: produce stringa finale ottimizzata su copertura residua.

## Keyword Planning (pre-content)

Output minimo richiesto e vincolante:

- `keyword_primaria_finale`
- `keyword_secondarie_prioritarie`
- `cluster_semantici`
- `parole_da_spingere_nel_frontend`
- `parole_da_tenere_per_backend`
- `note_su_keyword_da_non_forzare`

Regola: il planning non e una stringa finale, ma una strategia allocativa.

## Backend Final Terms (post-content)

Input obbligatori:

- keyword planning approvato
- titolo, bullet, descrizione gia generati
- verifica di copertura semantica residua

Obiettivo: coprire solo spazio utile non gia saturo nel frontend.

## Priorita di selezione

Ordine di priorita:
1) sinonimi ad alta intenzione,
2) frammenti long-tail utili,
3) termini di contesto d'uso,
4) termini di compatibilita,
5) materiali o attributi tecnici.

## Regole di esclusione

- Escludere aggettivi generici e termini marketing.
- Escludere targeting demografico non pertinente.
- Escludere frasi complete e termini gia dominanti nel frontend.
- Escludere ridondanze morfologiche prive di nuovo intento.

## Controllo byte e deduplica

- Output: una sola riga, termini separati da spazio, nessuna punteggiatura.
- Nessun termine duplicato.
- Massimizzare copertura semantica entro 250 byte UTF-8.
- Preferire termini compatti ad alto valore informativo.
