# DOGMA — Regole non negoziabili per il copy Amazon (Amazon Listing Engine)

Documento di prodotto: definisce vincoli editoriali, SEO e conversione per tutte le pipeline di generazione. Le sezioni con titolo `##` sono parse dal backend (`app.core.dogma`).

## Principi globali

- **MUST**: Il copy deve essere fedele ai dati del brief e dell’arricchimento confermato; nessun claim non supportato (certificazioni, risultati medici, garanzie non dichiarate).
- **MUST NOT**: Inganno, confronti aggressivi con marchi nominati, promesse assolute (“migliore al mondo”, “cura”, “guarisce”), contenuti fuori policy Amazon.
- **MUST NOT**: Keyword stuffing: non ripetere la stessa radice keyword in modo innaturale o in ogni frase.
- **MUST**: Chiarezza prima del marketing vuoto: benefici concreti, misure, materiali, compatibilità quando noti.
- **MUST**: Italiano del marketplace Amazon Italia; evitare calchi dall’inglese innaturali salvo termini tecnici accettati.
- **SHOULD**: Coerenza tra titolo, bullet e descrizione (stessi fatti, nessuna contraddizione).

### GLOSSARIO_STRATEGIA

- Nel prompt LLM i campi sono quelli di **`ConfirmedProductStrategy`** (Fase 1 `ProductBrief` + Fase 2 `StrategicEnrichment` assemblati dal backend).
- **`caratteristiche_tecniche`**: merge di `caratteristiche_specifiche` e righe testuali da `dettagli_articolo` / `dettagli_aggiuntivi` del brief.
- **`insight_recensioni_clienti`**: proviene da `riassunto_ai_recensioni` nel brief (solo claim supportati dal testo).
- **`linee_guida_brand`**: blocco composito (brand, `linee_guida_brand`, `note_utente`, estratti di `descrizione_attuale` / `bullet_attuali`); vincoli brand e copy legacy di riferimento, non testo da copiare pari pari.

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

### INPUT_OBBLIGATORI

- `nome_prodotto`
- `keyword_primarie` (almeno una, uso naturale)
- `livello_prezzo`

### INPUT_OPZIONALI

- `categoria`
- `caratteristiche_tecniche`
- `usp_differenziazione`
- `keyword_secondarie`
- `linee_guida_brand` (brand / vincoli)

### INPUT_MODERAZIONE

- `benefici_principali`: non trasformare in slogan né elenco nel titolo
- `angolo_emotivo`: non forzare nel titolo
- `insight_recensioni_clienti`: nessun claim non esplicitato nei dati
- `keyword_secondarie`: max integrazione se resta leggibile
- Ripetizione della stessa keyword: evitare

## Bullet point

- **MUST**: Esattamente **5** bullet per richiesta generazione standard.
- **MUST**: Ogni bullet concentrato su un beneficio o una prova sociale legata a dati reali (garanzia dichiarata, materiale, uso).
- **MUST NOT**: Bullet identici o quasi identici; riempitivo (“alta qualità”) senza dettaglio.
- **SHOULD**: Lunghezza moderata (frase o due); prima persona del brand solo se coerente con `linee_guida_brand`.
- **MUST NOT**: Allusioni a recensioni false o punteggi inventati.

### INPUT_OBBLIGATORI

- `nome_prodotto`
- Almeno uno tra `caratteristiche_tecniche` e `benefici_principali` (contenuto concreto per 5 bullet distinti)

### INPUT_OPZIONALI

- `usp_differenziazione`
- `gestione_obiezioni`
- `target_cliente`
- `insight_recensioni_clienti`
- `keyword_primarie`, `keyword_secondarie`
- `categoria`, `livello_prezzo`
- `linee_guida_brand`

### INPUT_MODERAZIONE

- `keyword_primarie` / `keyword_secondarie`: solo se naturali, no elenco keyword
- `angolo_emotivo`: leggero, mai teatrale
- `insight_recensioni_clienti`: niente punteggi o promesse inventate

## Descrizione

- **MUST**: Testo lungo in paragrafi (3–5 paragrafi brevi); niente elenco numerato tipo bullet nella descrizione.
- **MUST**: Integrare USP, target, gestione obiezioni quando presenti in strategia; non contraddire i bullet.
- **MUST NOT**: Keyword stuffing; copia-incolla del titolo ripetuto all’infinito.
- **SHOULD**: Rispettare range min/max caratteri indicato dal sistema; chiusura che rinforzi fiducia (senza CTA aggressiva).

### INPUT_OBBLIGATORI

- `nome_prodotto`

### INPUT_OPZIONALI

- `benefici_principali`, `usp_differenziazione`, `target_cliente`, `gestione_obiezioni`
- `caratteristiche_tecniche`
- `keyword_primarie`, `keyword_secondarie`
- `livello_prezzo`, `categoria`
- `insight_recensioni_clienti`

### INPUT_MODERAZIONE

- `angolo_emotivo`: supporto minimo, subordinato a chiarezza
- `keyword_primarie` / `keyword_secondarie`: no stuffing; non duplicare titolo/bullet pari pari
- `linee_guida_brand`: copy legacy solo come riferimento, non copia-incolla

## Keyword strategy (search terms)

- **MUST**: Una sola riga di termini separati da **spazio** (stile campo backend Amazon IT); niente virgole come separatore principale.
- **MUST**: Rispettare il limite **byte** UTF-8 configurato (tipicamente 249 byte policy Amazon).
- **MUST NOT**: Ripetere lo stesso lemma inutilmente; varianti solo se aggiungono intento distinto.
- **MUST NOT**: Termini promozionali, claim generici assoluti, riferimenti a minori o categorie sensibili non pertinenti.
- **SHOULD**: Copertura semantica: sinonimi leciti, usi, compatibilità, materiale, senza ridondanza.

### INPUT_OBBLIGATORI

- `nome_prodotto`
- `keyword_primarie` (base semantica; non ripetere inutilmente nel backend)

### INPUT_OPZIONALI

- `categoria`
- `caratteristiche_tecniche` (materiali, uso, compatibilità come termini)
- `benefici_principali`, `target_cliente` (intent e casi d’uso come parole, non frasi promozionali)
- `keyword_secondarie`
- `insight_recensioni_clienti` (solo termini fattuali presenti nel testo)

### INPUT_MODERAZIONE

- `usp_differenziazione`: no aggettivi marketing / claim generici nel backend
- `linee_guida_brand`: no brand name né slug promozionali; no spillare slogan
- Ripetizioni e sinonimi vuoti: evitare spreco di byte

## Checklist copy readiness

Prima di generare bullet o descrizione con qualità attesa:

- **MUST**: `nome_prodotto` valorizzato.
- **SHOULD**: Almeno una **keyword primaria** per titolo e search terms forti.
- **SHOULD**: Almeno uno tra `benefici_principali` e `usp_differenziazione` (post-arricchimento) per evitare copy generico.
