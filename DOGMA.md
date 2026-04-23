# DOGMA — Amazon Product Page Engine ITA

## DOGMA_MODE
runtime_generation_rules

## DOGMA_PURPOSE
Questo file contiene le regole operative da usare durante la generazione dei contenuti Amazon.
Ogni generatore deve leggere solo:
- GLOBAL_RULES
- la propria sezione specifica

Esempio:
- Genera Titolo -> GLOBAL_RULES + TITOLO
- Genera Bullet -> GLOBAL_RULES + BULLET_POINT
- Genera Descrizione -> GLOBAL_RULES + DESCRIZIONE
- Genera Keyword -> GLOBAL_RULES + KEYWORD_STRATEGY

## DOGMA_RUNTIME

- Il backend carica di default **[backend/DOGMA.md](backend/DOGMA.md)** (`app.core.dogma`, sezioni `##`); override con `DOGMA_MD_PATH`.
- Le mappature `INPUT_*` qui sotto usano i nomi **`ConfirmedProductStrategy`** (payload prompt post-assemblaggio Fase 1 + Fase 2), non solo i campi grezzi del form.

---

# GLOBAL_RULES

## OBIETTIVO
Generare contenuti Amazon:
- chiari
- leggibili
- conformi
- persuasivi
- pronti per copia e incolla

## REGOLA_BASE
La scheda prodotto non è una landing page e non è un annuncio adv.
Il tono deve essere:
- professionale
- concreto
- specifico
- credibile
- non teatrale

## PRIORITÀ_ASSOLUTE
1. conformità Amazon
2. chiarezza
3. pertinenza del prodotto
4. leggibilità mobile
5. conversione
6. SEO naturale

## DEVE_SEMPRE_FARE
- rappresentare fedelmente il prodotto
- usare solo dati coerenti con gli input forniti
- trasformare caratteristiche in benefici concreti
- mantenere il testo facile da capire
- usare keyword in modo naturale
- scrivere per il cliente, non per “riempire” parole chiave

## NON_DEVE_MAI_FARE
- inventare dati tecnici non presenti o non ragionevolmente deducibili
- usare claim promozionali come “migliore”, “top”, “imperdibile”
- usare tono da landing page o da televendita
- usare emoji o simboli decorativi
- inserire telefono, email, URL, spedizione, prezzo, disponibilità
- fare keyword stuffing
- ripetere la stessa parola inutilmente
- generare contenuti seller-centrici
- sembrare scritto per ads e non per catalogo Amazon

## TONE_BY_PRICE
- ECONOMICO = pratico, diretto, essenziale, orientato alla convenienza d’uso
- MEDIO = equilibrato, concreto, rassicurante, chiaro
- PREMIUM = autorevole, curato, distintivo, mai pomposo

## KEYWORD_POLICY
- la keyword primaria va usata dove serve davvero
- le keyword secondarie vanno selezionate in base a:
  - pertinenza
  - leggibilità
  - naturalezza
- non sacrificare mai chiarezza e naturalezza per aggiungere keyword

## INPUT_TRUST_ORDER
Ordine di priorità per i dati da usare:
1. dati manuali inseriti dall’utente
2. dati confermati nei campi di arricchimento strategico
3. dati sintetizzati da recensioni
4. inferenze ragionevoli e conservative
5. mai invenzioni

## GLOSSARIO_STRATEGIA

- **`caratteristiche_tecniche`**: merge di `caratteristiche_specifiche` e righe da `dettagli_articolo` / `dettagli_aggiuntivi` nel brief.
- **`insight_recensioni_clienti`**: da `riassunto_ai_recensioni` nel brief; solo claim supportati dal testo fornito.
- **`linee_guida_brand`**: composito (brand, `linee_guida_brand`, `note_utente`, estratti `descrizione_attuale` / `bullet_attuali`); vincoli e riferimenti, non copia letterale obbligata.

## FINAL_CHECK_GLOBAL
Prima di restituire qualsiasi output, il sistema deve verificare:
- è chiaro?
- è coerente col prodotto?
- è coerente con il livello prezzo?
- evita claim vietati?
- evita tono pubblicitario aggressivo?
- evita ripetizioni forzate?
- è pronto per copia e incolla su Amazon?

---

# TITOLO

## OBIETTIVO
Creare un titolo Amazon:
- orientato al CTR
- leggibile
- conforme
- utile per indicizzazione
- chiaro anche su mobile

## INPUT_OBBLIGATORI

- `nome_prodotto`
- `keyword_primarie` (almeno una, uso naturale)
- `livello_prezzo`

## INPUT_OPZIONALI

- `categoria`
- `caratteristiche_tecniche`
- `usp_differenziazione`
- `keyword_secondarie`
- `linee_guida_brand` (brand / vincoli)

## INPUT_MODERAZIONE

- `benefici_principali`: non trasformare in slogan né elenco nel titolo
- `angolo_emotivo`: non forzare nel titolo
- `insight_recensioni_clienti`: nessun claim non esplicitato nei dati
- `keyword_secondarie`: max integrazione se resta leggibile
- Ripetizione della stessa keyword: evitare

## HARD_RULES
- rispettare il limite massimo categoria/marketplace
- usare come limite interno prudenziale: 190 caratteri
- evitare caratteri speciali inutili
- evitare ripetizioni artificiali della stessa parola
- non usare claim promozionali
- non usare dettagli seller
- non usare prezzo, spedizione, disponibilità

## TARGET_EDITORIALE
- titolo idealmente forte nei primi 60–80 caratteri
- le informazioni più importanti devono stare all’inizio
- il titolo deve restare leggibile anche se troncato su mobile

## DEVE_INCLUDERE
- brand
- tipo prodotto
- caratteristica primaria o funzione chiave
- keyword primaria in forma naturale
- eventuale variante davvero utile
- misura/quantità/formato se rilevante
- compatibilità solo se realmente utile

## NON_DEVE_FARE
- keyword stuffing
- elenco caotico di keyword
- tono da slogan
- parole inutili che non aiutano la comprensione
- ripetizioni di “professionale”, “qualità”, “migliore” ecc. se non servono

## STRUTTURA_IDEALE
[Brand] [Tipo prodotto] [Caratteristica primaria / funzione / materiale] [Variante utile] [Misura o quantità se utile] [Compatibilità se utile]

## PRIORITÀ_INFORMATIVE
1. brand
2. tipo prodotto
3. funzione o beneficio funzionale
4. variante chiave
5. misura/quantità
6. compatibilità se necessaria

## TONO
- ECONOMICO = semplice, diretto, pratico
- MEDIO = bilanciato, ordinato, chiaro
- PREMIUM = pulito, preciso, distintivo

## CHECK_FINALE
- contiene il brand?
- chiarisce subito il tipo prodotto?
- contiene la keyword primaria in modo naturale?
- si capisce nei primi 60 caratteri?
- evita ripetizioni inutili?
- resta sotto il limite interno?
- è leggibile e non sembra spam?

---

# BULLET_POINT

## OBIETTIVO
Generare 5 bullet point Amazon:
- orientati alla conversione
- chiari
- concreti
- utili per smontare dubbi
- coerenti con il prodotto reale

## INPUT_OBBLIGATORI

- `nome_prodotto`
- Almeno uno tra `caratteristiche_tecniche` e `benefici_principali` (contenuto concreto per 5 bullet distinti)

## INPUT_OPZIONALI

- `usp_differenziazione`
- `gestione_obiezioni`
- `target_cliente`
- `insight_recensioni_clienti`
- `keyword_primarie`, `keyword_secondarie`
- `categoria`, `livello_prezzo`
- `linee_guida_brand`

## INPUT_MODERAZIONE

- `keyword_primarie` / `keyword_secondarie`: solo se naturali, no elenco keyword
- `angolo_emotivo`: leggero, mai teatrale
- `insight_recensioni_clienti`: niente punteggi o promesse inventate

## HARD_RULES
- generare 5 bullet distinti
- evitare emoji e simboli decorativi
- evitare claim vietati
- evitare dati seller
- evitare prezzo, spedizione, disponibilità
- evitare tono promozionale aggressivo

## STANDARD_INTERNO
Ogni bullet deve sviluppare una sola idea principale.
Ogni bullet deve aiutare il cliente a capire meglio il prodotto e comprare con più sicurezza.

## STRUTTURA_LOGICA_DEI_5_BULLET
- Bullet 1 = beneficio principale / risultato pratico
- Bullet 2 = prova tecnica / materiale / composizione / tecnologia
- Bullet 3 = uso / scenario d’uso / compatibilità
- Bullet 4 = misure / quantità / contenuto / manutenzione
- Bullet 5 = differenziatore / sicurezza / elemento distintivo

## DEVE_INCLUDERE
- benefici pratici
- dati tecnici concreti
- elementi che riducono obiezioni
- linguaggio credibile
- eventuali insight recensioni, se rilevanti
- keyword primarie e secondarie solo se naturali

## NON_DEVE_FARE
- sembrare una landing page
- usare frasi teatrali
- ripetere sempre lo stesso concetto
- fare elenco di keyword
- dire cose vaghe come “qualità top”, “risultato incredibile”
- usare claim non verificabili

## REGOLA_BENEFICI
Ogni bullet deve partire da ciò che il cliente ottiene, non solo da ciò che il prodotto “ha”.

## REGOLA_OBIEZIONI
Quando possibile, almeno 1–2 bullet devono ridurre obiezioni reali come:
- facilità d’uso
- sicurezza
- compatibilità
- pulizia/manutenzione
- resistenza
- praticità

## FORMATO_CONSIGLIATO
Ogni bullet:
- 1 idea principale
- 2–3 frasi brevi massimo
- facilmente copiabile su Amazon
- leggibile anche fuori contesto

## CHECK_FINALE
- i 5 bullet sono davvero distinti?
- ogni bullet porta un’informazione utile?
- le caratteristiche sono trasformate in benefici?
- ci sono obiezioni affrontate?
- il linguaggio è concreto?
- non ci sono ripetizioni fastidiose?
- non sembra testo da ads?

---

# DESCRIZIONE

## OBIETTIVO
Creare una descrizione Amazon:
- chiara
- convincente
- credibile
- utile a completare titolo e bullet
- orientata alla conversione senza essere aggressiva

## INPUT_OBBLIGATORI

- `nome_prodotto`

## INPUT_OPZIONALI

- `benefici_principali`, `usp_differenziazione`, `target_cliente`, `gestione_obiezioni`
- `caratteristiche_tecniche`
- `keyword_primarie`, `keyword_secondarie`
- `livello_prezzo`, `categoria`
- `insight_recensioni_clienti`

## INPUT_MODERAZIONE

- `angolo_emotivo`: supporto minimo, subordinato a chiarezza
- `keyword_primarie` / `keyword_secondarie`: no stuffing; non duplicare titolo/bullet pari pari
- `linee_guida_brand`: copy legacy solo come riferimento, non copia-incolla

## HARD_RULES
- plain text
- no HTML non necessario
- no markup decorativo
- no dati seller
- no URL
- no email
- no telefono
- no prezzo/spedizione/disponibilità
- no keyword stuffing

## OBIETTIVO_EDITORIALE
La descrizione deve:
- chiarire il prodotto
- chiarire per chi è
- spiegare il bisogno che risolve
- migliorare fiducia e comprensione
- integrare USP, obiezioni e benefici
- NON duplicare semplicemente titolo e bullet

## STRUTTURA_IDEALE
Paragrafo 1 = che cos’è il prodotto e per chi è  
Paragrafo 2 = problema che risolve / vantaggio principale  
Paragrafo 3 = come si usa / quando si usa / in che contesto rende meglio  
Paragrafo 4 = dettagli tecnici / materiali / misure / contenuto / note utili  
Paragrafo 5 = cura / compatibilità / avvertenze / dettagli finali se necessari

## DEVE_INCLUDERE
- benefici pratici
- target o scenario d’uso
- dettagli tecnici realmente utili
- differenziazione
- elementi che riducono attrito
- eventuali insight recensioni se utili alla fiducia

## NON_DEVE_FARE
- sembrare una landing page
- usare CTA aggressive
- sembrare teatrale
- ripetere in blocco tutte le keyword
- duplicare parola per parola bullet e titolo
- promettere risultati non verificabili

## TONO
- professionale
- concreto
- fluido
- credibile
- non promozionale

## LUNGHEZZA_INTERNA_CONSIGLIATA
- target interno: 1200–1500 caratteri max
- paragrafi brevi
- leggibilità alta

## CHECK_FINALE
- chiarisce bene il prodotto?
- chiarisce per chi è?
- spiega il valore reale?
- usa dati tecnici utili?
- riduce dubbi?
- non ripete troppo?
- è facile da leggere?
- è pronto per copia e incolla?

---

# KEYWORD_STRATEGY

## OBIETTIVO
Generare backend search terms Amazon:
- pertinenti
- compatti
- senza ripetizioni
- ad alta copertura semantica
- realmente utili alla ricerca

## INPUT_OBBLIGATORI

- `nome_prodotto`
- `keyword_primarie` (base semantica; non ripetere inutilmente nel backend)

## INPUT_OPZIONALI

- `categoria`
- `caratteristiche_tecniche` (materiali, uso, compatibilità come termini)
- `benefici_principali`, `target_cliente` (intent e casi d’uso come parole, non frasi promozionali)
- `keyword_secondarie`
- `insight_recensioni_clienti` (solo termini fattuali presenti nel testo)

## INPUT_MODERAZIONE

- `usp_differenziazione`: no aggettivi marketing / claim generici nel backend
- `linee_guida_brand`: no brand name né slug promozionali; no spillare slogan
- Ripetizioni e sinonimi vuoti: evitare spreco di byte

## HARD_RULES
- stare sotto 250 byte
- evitare brand
- evitare ASIN
- evitare parole volgari
- evitare termini non pertinenti
- evitare frasi complete
- evitare ripetizioni inutili

## DEVE_INCLUDERE
- sinonimi
- varianti di ricerca
- keyword generiche utili
- long-tail pertinenti
- casi d’uso
- materiali
- compatibilità
- elementi non già coperti bene nel front-end
- varianti inglesi comuni solo se realmente utili

## NON_DEVE_FARE
- usare aggettivi marketing
- usare target demografici inutili
- usare slogan
- usare punteggiatura
- usare testo discorsivo
- duplicare tutto il titolo

## FORMATO_OUTPUT
- una sola riga
- solo keyword
- separate da spazio
- nessuna punteggiatura
- nessuna ripetizione
- orientate alla combinabilità

## STRATEGIA
- priorità a query realistiche da barra Amazon
- preferire termini con forte intenzione di ricerca
- usare il backend per coprire ciò che non è già coperto bene nel front-end
- non sprecare spazio con doppioni inutili

## CHECK_FINALE
- è una sola riga?
- è sotto 250 byte?
- contiene solo termini utili?
- evita ripetizioni?
- evita brand e ASIN?
- massimizza copertura semantica?

---

# OPTIONAL_SUPPORT_RULES

## BENEFICI_PRINCIPALI
Quando il sistema deve suggerire i benefici:
- partire sempre dalle caratteristiche reali
- tradurre la funzione in vantaggio pratico per l’utente
- privilegiare benefici concreti, non slogan

## USP_DIFFERENZIAZIONE
Quando il sistema deve suggerire USP:
- usare solo elementi distintivi verificabili
- preferire differenze reali di:
  - materiali
  - funzione
  - precisione
  - resistenza
  - praticità
  - contenuto confezione
  - sicurezza
- evitare USP inventate o vaghe

## TARGET_CLIENTE
Quando il sistema deve suggerire il target:
- preferire target d’uso realistici
- definire chi trae più valore dal prodotto
- non usare target troppo ampi o generici senza motivo

## GESTIONE_OBIEZIONI
Quando il sistema deve suggerire obiezioni:
- individuare i dubbi più probabili
- aiutare il testo finale a ridurli
- usare solo obiezioni coerenti col prodotto

## ANGOLO_EMOTIVO
Quando il sistema deve suggerire angolo emotivo:
- mantenerlo leggero
- subordinato a chiarezza e credibilità
- usare emozione come supporto alla conversione, non come teatro

---

# GENERATION_RUNTIME_RULE

## COME_USARE_IL_DOGMA
Ogni generatore deve:
1. caricare GLOBAL_RULES
2. caricare solo la sezione specifica richiesta
3. unire le regole ai dati del prodotto
4. generare l’output
5. eseguire il check finale della sezione
6. restituire un testo pronto per copia e incolla

## MAPPA_SEZIONI
- genera_titolo -> GLOBAL_RULES + TITOLO
- genera_bullet -> GLOBAL_RULES + BULLET_POINT
- genera_descrizione -> GLOBAL_RULES + DESCRIZIONE
- genera_keyword -> GLOBAL_RULES + KEYWORD_STRATEGY

## REGOLA_FINALE_ASSOLUTA
Se una regola interna entra in conflitto con una regola Amazon di categoria o marketplace, prevale sempre la regola Amazon più restrittiva.