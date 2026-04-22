# DOGMA — Regole non negoziabili per il copy Amazon (Amazon Listing Engine)

Documento di prodotto: definisce vincoli editoriali, SEO e conversione per tutte le pipeline di generazione. Le sezioni con titolo `##` sono parse dal backend (`app.core.dogma`).

## Principi globali

- **MUST**: Il copy deve essere fedele ai dati del brief e dell’arricchimento confermato; nessun claim non supportato (certificazioni, risultati medici, garanzie non dichiarate).
- **MUST NOT**: Inganno, confronti aggressivi con marchi nominati, promesse assolute (“migliore al mondo”, “cura”, “guarisce”), contenuti fuori policy Amazon.
- **MUST NOT**: Keyword stuffing: non ripetere la stessa radice keyword in modo innaturale o in ogni frase.
- **MUST**: Chiarezza prima del marketing vuoto: benefici concreti, misure, materiali, compatibilità quando noti.
- **MUST**: Italiano del marketplace Amazon Italia; evitare calchi dall’inglese innaturali salvo termini tecnici accettati.
- **SHOULD**: Coerenza tra titolo, bullet e descrizione (stessi fatti, nessuna contraddizione).

## Tono e registri

In base a `livello_prezzo` (entry / mid / premium / unknown):

- **entry**: tono diretto, valore e affidabilità; aggettivi sobri; focus su utilità quotidiana e rapporto qualità-prezzo senza hype.
- **mid**: tono professionale-accessibile; equilibrio tra emozione leggera e concretezza; evidenziare qualità e versatilità.
- **premium**: tono raffinato ma concreto; enfasi su materiali, design, durata, esperienza; niente snobismo o arroganza; niente eccesso di superlativi.
- **unknown**: stesso stile **mid**, evitando aggettivi estremi finché il tier non è definito.

## Formattazione comune

- **MUST NOT**: MAIUSCOLE CONTINUE (gridare), emoji, simboli promozionali eccessivi (!!!), HTML nella descrizione (testo piano).
- **MUST**: Punteggiatura corretta; frasi leggibili; unità di misura coerenti (es. cm, mm, kg).
- **SHOULD**: Prima lettera maiuscola a inizio bullet; nella descrizione paragrafi brevi separati da riga vuota.

## Regole conversione

- **MUST**: Beneficio prima della feature quando possibile (“Ordina la scrivania senza ingombri” vs elenco tecnico secco).
- **MUST NOT**: Call-to-action fuori luogo tipo “compra ora”, “clicca qui”, linguaggio da landing non-Amazon.
- **SHOULD**: Una sola idea dominante per bullet; evitare tre concetti diversi nella stessa riga.
- **SHOULD**: Ripetizione del nome brand controllata: utile in titolo o dove serve riconoscibilità, non in ogni riga.

## Titolo SEO

- **MUST**: Rispettare il limite caratteri configurato dal sistema (target tipico entro le policy Amazon per categoria).
- **MUST**: Inserire le **keyword primarie** in modo naturale (1–2 occorrenze pertinenti); secondarie solo se non compromettono la leggibilità.
- **MUST NOT**: Ripetere la stessa parola chiave più volte in forma ridondante; separatori spam (pipe multipli, keyword list).
- **SHOULD**: Struttura informativa: cosa è + differenziatore chiave + attributo rilevante (misura, materiale, uso) quando applicabile.
- **MUST NOT**: Tutolo “clickbait” non supportato dai dati prodotto.

## Bullet point

- **MUST**: Esattamente **5** bullet per richiesta generazione standard.
- **MUST**: Ogni bullet concentrato su un beneficio o una prova sociale legata a dati reali (garanzia dichiarata, materiale, uso).
- **MUST NOT**: Bullet identici o quasi identici; riempitivo (“alta qualità”) senza dettaglio.
- **SHOULD**: Lunghezza moderata (frase o due); prima persona del brand solo se coerente con `linee_guida_brand`.
- **MUST NOT**: Allusioni a recensioni false o punteggi inventati.

## Descrizione

- **MUST**: Testo lungo in paragrafi (3–5 paragrafi brevi); niente elenco numerato tipo bullet nella descrizione.
- **MUST**: Integrare USP, target, gestione obiezioni quando presenti in strategia; non contraddire i bullet.
- **MUST NOT**: Keyword stuffing; copia-incolla del titolo ripetuto all’infinito.
- **SHOULD**: Rispettare range min/max caratteri indicato dal sistema; chiusura che rinforzi fiducia (senza CTA aggressiva).

## Keyword strategy (search terms)

- **MUST**: Una sola riga di termini separati da **spazio** (stile campo backend Amazon IT); niente virgole come separatore principale.
- **MUST**: Rispettare il limite **byte** UTF-8 configurato (tipicamente 249 byte policy Amazon).
- **MUST NOT**: Ripetere lo stesso lemma inutilmente; varianti solo se aggiungono intento distinto.
- **MUST NOT**: Termini promozionali, claim generici assoluti, riferimenti a minori o categorie sensibili non pertinenti.
- **SHOULD**: Copertura semantica: sinonimi leciti, usi, compatibilità, materiale, senza ridondanza.

## Checklist copy readiness

Prima di generare bullet o descrizione con qualità attesa:

- **MUST**: `nome_prodotto` valorizzato.
- **SHOULD**: Almeno una **keyword primaria** per titolo e search terms forti.
- **SHOULD**: Almeno uno tra `benefici_principali` e `usp_differenziazione` (post-arricchimento) per evitare copy generico.
