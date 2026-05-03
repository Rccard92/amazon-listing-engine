/**
 * Testi interfaccia in italiano (MVP centralizzato).
 * Nomi variabili e chiavi restano in inglese dove serve al codice.
 */

export const it = {
  brand: {
    short: "ALE",
    name: "Amazon Listing Engine",
    tagline: "Motore per schede prodotto Amazon",
  },
  nav: {
    home: "Home",
    newListing: "Nuova scheda manuale",
    listingGeneration: "Generazione scheda",
    history: "Cronologia",
    projects: "Progetti salvati",
    cta: "Nuova scheda manuale",
  },
  common: {
    required: "Obbligatorio",
    optional: "Facoltativo",
    examplePrefix: "Esempio:",
    nextStep: "Cosa succede dopo",
    openWorkflow: "Apri percorso",
    saveDraft: "Salva bozza",
    continue: "Continua",
    cancel: "Annulla",
    startAudit: "Avvia analisi",
    generateProposal: "Genera proposta",
    open: "Apri",
    rename: "Rinomina",
    duplicate: "Duplica",
    moveToProject: "Sposta in un progetto",
    delete: "Elimina",
    createProject: "Crea nuovo progetto",
    createAndMove: "Crea e sposta",
    save: "Salva",
    loading: "Caricamento in corso...",
  },
  home: {
    kicker: "Amazon Listing Engine",
    heroTitle:
      "Crea schede prodotto Amazon con input strutturato, strategia chiara e generazione guidata del copy.",
    heroBody:
      "Il percorso principale è manuale: inserisci prodotto e keyword, poi generi titolo, bullet, descrizione e search terms con obiettivi distinti. Eventuali flussi da URL Amazon restano solo lato backend opzionale in fasi successive.",
    workflowsHeading: "Cosa vuoi fare adesso?",
    workflowsIntro:
      "Il flusso consigliato parte da dati manuali e dalla generazione per sezioni. I vecchi percorsi da URL Amazon reindirizzano alla nuova scheda manuale.",
    benefitsHeading: "Perché usare questa piattaforma",
    benefitsIntro:
      "Ti aiutiamo a lavorare sulle schede prodotto in modo più ordinato, con meno dubbi e decisioni più rapide.",
    benefits: [
      {
        title: "Input strutturato prima del copy",
        description:
          "Raccogli nome, benefici e parole chiave in modo ordinato: è la base per titolo, bullet e descrizione coerenti.",
      },
      {
        title: "Generazione per sezioni (non un prompt unico)",
        description:
          "Titolo SEO, punti elenco, descrizione e keyword backend hanno regole e obiettivi separati, come in un vero listing engine.",
      },
      {
        title: "Keyword manuali o file Helium10",
        description:
          "Puoi lavorare nel modo che preferisci: scrittura libera o caricamento CSV, sempre con indicazioni pratiche.",
      },
    ],
  },
  workflows: {
    cards: [
      {
        href: "/new-listing",
        title: "Nuova scheda da dati manuali",
        description:
          "Percorso principale del MVP: inserisci prodotto, benefici e parole chiave. Salva la bozza e passa alla generazione del copy.",
        badge: "Percorso principale",
        nextHint:
          "Dopo il salvataggio: Fase 2 arricchimento strategico, Fase 3 keyword planning, poi Fase 4 generazione.",
        cta: "Inizia da input manuale",
      },
      {
        href: "/listing-generazione",
        title: "Generazione scheda (copy Amazon)",
        description:
          "Quattro sezioni distinte con regole dedicate: titolo, punti elenco, descrizione e search terms. Collega una bozza da Cronologia oppure compila la strategia qui.",
        badge: "Output",
        nextHint:
          "Con un work item salvato, aggiungi ?workItemId= nella URL oppure compila la strategia a mano nella stessa pagina.",
        cta: "Apri generazione",
      },
    ],
  },
  /** Fallback IT allineati alla tassonomia backend (`error_code`). Il messaggio del server ha priorità se diverso. */
  workflowErrors: {
    INVALID_URL: "L'indirizzo inserito non è valido.",
    UNSUPPORTED_MARKETPLACE: "Dominio Amazon non supportato.",
    ASIN_NOT_FOUND: "Non siamo riusciti a individuare il codice prodotto (ASIN) dal link.",
    FETCH_TIMEOUT: "La pagina ha impiegato troppo tempo a rispondere. Riprova più tardi.",
    FETCH_HTTP_403: "Accesso alla pagina negato. Amazon potrebbe limitare la visualizzazione automatica.",
    FETCH_HTTP_429: "Troppe richieste verso Amazon. Attendi qualche minuto e riprova.",
    FETCH_HTTP_ERROR: "Errore durante il caricamento della pagina.",
    CHALLENGE_DETECTED:
      "Amazon ha mostrato un controllo anti-bot. Apri il link nel browser e riprova più tardi.",
    EXTRACTION_EMPTY: "Pagina caricata ma non abbiamo estratto dati prodotto utili.",
    EXTRACTION_PARTIAL: "Estrazione parziale: alcuni dati mancano; puoi continuare con cautela.",
    PARSER_ERROR: "Errore nell'analisi della pagina.",
    OPENAI_NOT_CONFIGURED: "Servizio di analisi AI non configurato sul server.",
    OPENAI_REQUEST_FAILED: "L'analisi automatica non è riuscita. Riprova.",
    OPENAI_RATE_LIMIT: "Limite richieste al servizio AI. Riprova tra poco.",
    AI_OUTPUT_INVALID: "Risposta dell'AI non valida. Riprova.",
    STRATEGY_INCOMPLETE: "Completa almeno il nome prodotto nella strategia prima di generare.",
    UNKNOWN: "Si è verificato un errore imprevisto.",
  },
  newListing: {
    title: "Nuova scheda prodotto",
    subtitle:
      "Raccogliamo le informazioni sul prodotto e sulle parole chiave. Non serve essere esperti: segui i passaggi e usa gli aiuti “?” accanto ai campi.",
    steps: {
      product: {
        title: "Dettagli del prodotto",
        description: "Qui descriviamo cosa vendi, così titolo e testi rispecchiano davvero il prodotto.",
        intro:
          "In questo passaggio servono nome, categoria e punti di forza. Non serve testo perfetto: puoi incollare appunti o bullet del fornitore.",
        sectionHelp: {
          title: "Perché questi dati",
          body: "Nome e categoria aiutano a inquadrare il prodotto. I punti di forza diventano spesso i bullet nella scheda: più sono concreti (materiali, misure, benefici), meglio è.",
        },
        fields: {
          name: {
            label: "Nome o titolo provvisorio del prodotto",
            hint: "Scrivi come lo chiameresti a voce. Evita abbreviazioni misteriose.",
            example: "Organizer da scrivania per cavi, in alluminio",
            help: {
              title: "Cosa inserire",
              body: "Il nome che vedi sulla confezione o sul listino va bene. Serve solo a capire di che prodotto si tratta prima di costruire il titolo Amazon ufficiale.",
            },
          },
          category: {
            label: "Categoria su Amazon (se la conosci)",
            hint: "Facoltativo ma utile: es. Casa e cucina, Elettronica.",
            example: "Casa e cucina › Organizzazione interni",
            optional: true,
            help: {
              title: "Perché la categoria",
              body: "Amazon organizza i prodotti per categorie. Se non sei sicuro, lascia un’ipotesi o salta: potrai correggere dopo.",
            },
          },
          benefits: {
            label: "Punti di forza e benefici",
            hint: "Elenco puntato va bene: misure, materiali, per chi è pensato, cosa risolve.",
            example: "Alluminio leggero; ingombro ridotto; adatto a monitor fino a 27 pollici",
            help: {
              title: "Come scriverli bene",
              body: "Pensa a cosa chiederebbe un cliente dubbioso. Evita superlativi vuoti: preferisci dettagli verificabili (peso, compatibilità, certificazioni).",
            },
          },
        },
      },
      keywords: {
        title: "Parole chiave di ricerca",
        tabsAriaLabel: "Modalità per le parole chiave",
        description: "Qui raccogliamo le ricerche per cui vuoi essere trovato, a mano o da file.",
        intro:
          "Puoi digitare le parole a mano oppure preparare un file dalla ricerca Helium10. Scegli la modalità che ti è più comoda: il passo dopo serve solo se usi il file.",
        sectionHelp: {
          title: "Parole chiave spiegate semplice",
          body: "Sono le frasi che i clienti digitano su Amazon. Non devono ripetere tutto il titolo: servono varianti (sinonimi, usi, misure) che aiutano la scheda a comparire nelle ricerche giuste.",
        },
        tabs: {
          manual: "Scrivo le parole a mano",
          csv: "Ho un file da Helium10",
        },
        manual: {
          label: "Elenco parole chiave",
          hint: "Separate da virgola o da riga. Non serve ordine perfetto.",
          placeholder:
            "es. organizer cavi scrivania, gestione cavi ufficio, clip cavi scrivania legno",
          help: {
            title: "Cosa scrivere",
            body: "Inserisci le ricerche che ti sembrano pertinenti, anche in forma semplice. Più tardi potremo raggrupparle (principali, secondarie, da escludere).",
          },
        },
        csvBlurb:
          "Se usi Helium10, esporta un file CSV con le tue ricerche. Nel passaggio successivo lo carichi qui: niente operazioni tecniche sul file.",
      },
      upload: {
        title: "Carica il file CSV (Helium10)",
        description: "Trascina il file o sceglilo dal computer: accettiamo solo CSV per sicurezza e chiarezza.",
        intro:
          "Serve solo se hai scelto la modalità file. Se hai scritto le parole a mano, puoi comunque caricare un file extra oppure saltare e andare avanti.",
        sectionHelp: {
          title: "File Helium10",
          body: "Helium10 è uno strumento che esporta elenchi di ricerche. Il file che scarichi di solito è in formato CSV: è un foglio semplice apribile anche con Excel.",
        },
      },
    },
    dropzone: {
      title: "Trascina qui il file CSV",
      description: "Puoi anche cliccare per scegliere il file dal computer.",
      empty: "Nessun file ancora. Quando sei pronto, carica un CSV esportato da Helium10 (o un elenco salvato come CSV).",
      selectedHeading: "File selezionato",
      hintLine:
        "Formato supportato: .csv. Se il file è molto grande, potrebbe servire un attimo in più in futuro quando collegheremo l’elaborazione.",
    },
    phases: {
      data: "Fase 1 · Dati prodotto",
      enrich: "Fase 2 · Arricchimento strategico",
      keywordIntel: "Fase 3 · Keyword Intelligence",
      keywordPlan: "Fase 3b · Keyword planning (legacy)",
      generate: "Fase 4 · Generazione contenuti",
      phase1Active: "Stai compilando il brief strutturato (DOGMA-ready).",
      afterSave:
        "Salva la bozza, poi passa ad arricchimento strategico e Keyword Intelligence prima della generazione del copy.",
    },
    brief: {
      identityTitle: "Identità e brand",
      identityIntro: "Nome, categoria, brand e livello di prezzo guidano tono e posizionamento.",
      referenceTitle: "Copy di riferimento (ispirazione)",
      referenceIntro:
        "Incolla descrizione e bullet di una scheda simile o del tuo catalogo: non verranno copiati, servono come contesto.",
      specsTitle: "Specifiche e contesto",
      specsIntro: "Dettagli tecnici, note qualitative e sintesi recensioni (se le hai).",
      kwTitle: "Parole chiave e file",
      kwIntro: "Keyword separate per priorità; puoi anche allegare un CSV Helium10 come promemoria.",
      brand: { label: "Brand", hint: "Default Meridiana; modifica se il listing è per un altro marchio." },
      descrizioneAttuale: { label: "Descrizione attuale / catalogo", hint: "Testo lungo di riferimento." },
      bulletAttuali: { label: "Bullet attuali", hint: "Un bullet per riga; aggiungi o rimuovi voci.", add: "Aggiungi bullet", remove: "Rimuovi" },
      caratteristiche: { label: "Caratteristiche specifiche", hint: "Una per riga o elenco puntato; diventano linee guida tecniche." },
      dettagliArticolo: { label: "Dettagli articolo", hint: "Misure, compatibilità, contenuto confezione, ecc." },
      dettagliAggiuntivi: { label: "Dettagli aggiuntivi", hint: "Qualsiasi altro dato utile al copy." },
      riassuntoRecensioni: { label: "Riassunto da recensioni", hint: "Temi ricorrenti lodi/critiche (senza citare testi protetti)." },
      kwPrimary: { label: "Keyword primarie", hint: "Separate da virgola o riga." },
      kwSecondary: { label: "Keyword secondarie", hint: "Separate da virgola o riga." },
      priceTier: { label: "Livello prezzo (tono)" },
      lineeGuida: { label: "Linee guida brand", hint: "Tono, divieti lessicali, claim consentiti." },
      noteUtente: { label: "Note e vincoli", hint: "Cosa non dire, obblighi legali, preferenze." },
      goEnrich: "Vai all’arricchimento strategico",
    },
  },
  manualWorkflow: {
    enrichPageTitle: "Arricchimento strategico",
    enrichPageSubtitle:
      "Definisci benefici, USP, target, obiezioni e angolo emotivo. Puoi suggerire con l’AI e modificare tutto prima di generare il copy.",
    suggestAi: "Suggerisci con AI",
    suggestAiHint: "Usa il brief salvato nel work item (richiede API OpenAI sul server).",
    saveEnrichment: "Salva arricchimento",
    savedEnrichment: "Arricchimento salvato.",
    goGenerate: "Vai a Keyword Intelligence",
    missingBrief: "Work item senza product_brief: torna alla Fase 1 e salva il modulo.",
    fields: {
      benefici: "Benefici principali",
      usp: "USP / differenziazione",
      target: "Target cliente",
      obiezioni: "Gestione obiezioni",
      emotivo: "Angolo emotivo",
    },
    enrichHelp: "Un beneficio o obiezione per riga nelle liste.",
  },
  keywordPlanning: {
    badge: "Fase 3b · Keyword planning (compatibilità)",
    title: "Keyword planning strategico",
    subtitle:
      "Definisci il piano keyword che guidera titolo, bullet e descrizione. I backend terms finali saranno generati dopo i contenuti frontend.",
    suggest: "Suggerisci keyword planning con AI",
    save: "Salva keyword planning",
    saved: "Keyword planning salvato.",
    goGenerate: "Vai alla generazione contenuti",
    fields: {
      primary: "Keyword primaria finale",
      secondary: "Keyword secondarie prioritarie (una per riga)",
      frontendPush: "Parole da spingere nel frontend (una per riga)",
      backendKeep: "Parole da tenere per backend (una per riga)",
      notes: "Note su keyword da non forzare (una per riga)",
    },
  },
  keywordIntelligence: {
    badge: "Fase 3 · Keyword Intelligence",
    title: "Keyword Intelligence",
    subtitle:
      "Carica le keyword, ottieni un piano semplice da usare nei contenuti e confermalo prima della generazione.",
    uploadTitle: "Upload Helium10 (CSV/XLSX)",
    uploadHint:
      "CSV supportato con parsing completo. XLSX viene tracciato e gestito in fallback seed, senza bloccare il workflow.",
    uploadLoaded: {
      title: "File Helium10 caricato",
      fileLabel: "File",
      statusLabel: "Stato",
      statusValue: "Caricato",
      rowsLabel: "Righe keyword parse",
      timestampLabel: "Caricato il",
      replace: "Sostituisci file",
      remove: "Rimuovi file",
    },
    manualSeedsLabel: "Seed keyword manuali (una per riga)",
    run: "Analizza keyword intelligence",
    save: "Salva piano keyword confermato",
    saved: "Keyword Intelligence salvata.",
    goGenerate: "Vai alla generazione contenuti",
    goLegacy: "Apri keyword planning legacy",
    debugTitle: "Dettaglio tecnico AI",
    debugHint: "Sezione tecnica per vedere decisioni, regole e trace interne del motore.",
    forensic: {
      title: "Debug Keyword Intelligence (Forensic)",
      subtitle: "Trace runtime completa: ingestion, regole, AI, veto, refinement e mapping finale.",
      analysisSourceLabel: "Origine analisi",
      staleLabel: "Stato",
      staleYes: "saved/stale",
      staleNo: "fresh/allineata",
      currentFingerprintLabel: "Fingerprint corrente",
      savedFingerprintLabel: "Fingerprint salvato",
      empty: "Nessuna forensic trace disponibile in questa esecuzione.",
      pipeline: "Meta pipeline e fallback",
      stages: "Stage outcomes",
      keywordMap: "Keyword reason map",
      freshness: "Freshness data",
    },
    debugShow: "Mostra dettaglio AI / Debug",
    debugHide: "Nascondi dettaglio AI / Debug",
    planConfirmLabel: "Confermo il piano keyword da usare nella scheda",
    planConfirmedBadge: "Piano confermato dall'utente",
    planNotConfirmedBadge: "Piano non ancora confermato",
    interpretation: {
      title: "Interpretazione prodotto",
      summaryTitle: "Sintesi prodotto interpretato",
      productDetected: "Prodotto rilevato",
      categoryDetected: "Categoria rilevata",
      confidence: "Affidabilita analisi",
      confirmedAttributes: "Attributi confermati",
      excludedAttributes: "Attributi esclusi",
      uncertainAttributes: "Attributi incerti",
      empty: "Nessun dato disponibile.",
    },
    decisions: {
      title: "Decisioni AI",
      subtitle: "Dettaglio tecnico delle decisioni e classificazioni automatiche.",
      contentKeywords: "Keyword usate nei contenuti (tecnico)",
      coreKeywords: "Gruppo principale",
      supportKeywords: "Gruppo di supporto",
      backendKeywords: "Keyword backend (tecnico)",
      backendHint: "Varianti pertinenti per backend search terms, senza competitor e fuori target.",
      excluded: "Keyword escluse",
      verify: "Keyword da verificare",
      verifyHint: "Verifica necessaria su attributo/caratteristica non confermata.",
      showDebug: "Mostra trace tecnico",
      hideDebug: "Nascondi trace tecnico",
      none: "Nessuna keyword in questo gruppo.",
      keyword: "Keyword",
      category: "Categoria",
      priority: "Priorità",
      usage: "Utilizzo consigliato",
      reason: "Motivo",
      requiredConfirmation: "Richiede conferma utente",
      reasons: {
        competitorBrand: "competitor brand",
        offTarget: "off target",
        wrongProductType: "wrong product type",
        unsupportedFeature: "unsupported feature",
        tooAmbiguous: "too risky / too ambiguous",
        forbiddenConcept: "concetto vietato",
        irrelevantIntent: "intento non rilevante",
        generic: "esclusa dal motore regole",
      },
    },
    finalPlan: {
      title: "Keyword selezionate per la scheda",
      summaryHint: "Le keyword incluse alimentano titolo, bullet, descrizione e backend; le escluse non compariranno mai nei testi generati.",
      addManualTitle: "Aggiungi keyword manuale",
      addManualPlaceholder: "Inserisci una keyword da includere",
      addManualAction: "+ Aggiungi keyword",
      includedTitle: "Keyword incluse",
      includedHint: "Disponibili per la generazione. Usa “-” per spostare una keyword tra le escluse.",
      excludedTitle: "Keyword escluse",
      excludedHint: "Non verranno usate nel titolo, nei bullet, nella descrizione né nei search terms backend.",
      verify: "Da verificare prima dell’uso",
      verifyHint: "Il sistema segnala possibili ambiguità: controlla nel prodotto reale prima di forzarle nel copy.",
      showExcluded: "Mostra elenco",
      hideExcluded: "Nascondi elenco",
      restore: "Ripristina",
      originAi: "AI",
      originManual: "Manuale",
      empty: "Nessuna keyword inclusa al momento.",
      noExcluded: "Nessuna keyword esclusa.",
    },
    sections: {
      detected: "Prodotto interpretato",
      attrsMain: "Attributi principali rilevati",
      attrsExcluded: "Attributi esclusi",
      attrsUncertain: "Attributi incerti",
      clarifications: "Domande di chiarimento",
      classifications: "Classificazione keyword",
      confirmedPlan: "Piano keyword confermato",
    },
  },
  history: {
    title: "Cronologia",
    subtitle:
      "Qui trovi tutte le attività recenti e in corso, anche quelle non ancora assegnate a un progetto.",
    emptyTitle: "Nessuna attività salvata",
    emptyBody:
      "Inizia uno dei percorsi principali e troverai qui la tua scheda prodotto in automatico, pronta da riprendere.",
    moveHint: "Puoi organizzare ogni attività con l'azione “Sposta in un progetto”.",
  },
  projects: {
    title: "Progetti salvati",
    subtitle:
      "Organizza il lavoro in cartelle progetto. Ogni cartella può contenere più schede prodotto o analisi.",
    emptyTitle: "Nessun progetto creato",
    emptyBody:
      "Crea il primo progetto per organizzare le attività salvate in Cronologia.",
    insideTitle: "Contenuto progetto",
    insideSubtitle: "Elementi presenti nella cartella selezionata.",
    projectNameLabel: "Nome progetto",
    projectNamePlaceholder: "Es. Accessori cucina",
    projectDescriptionLabel: "Descrizione (facoltativa)",
    projectDescriptionPlaceholder: "Es. Linea utensili 2026",
    noItemsInProject: "Questa cartella non contiene ancora elementi.",
  },
  listingGeneration: {
    pageTitle: "Generazione scheda Amazon",
    pageSubtitle:
      "Ogni sezione ha obiettivi diversi: titolo SEO, bullet, descrizione e keyword backend sono generate con pipeline dedicate, non con un unico prompt generico.",
    loadStrategyError:
      "Impossibile caricare la strategia da questo elemento. Compila i campi qui o riapri da una bozza salvata (input manuale).",
    workItemHint: "Collegata a bozza cronologia. Puoi salvare gli output nella stessa attività.",
    projectStatusCompletedHint: "Stato: progetto confermato",
    strategyPanelTitle: "Strategia prodotto confermata",
    strategyPanelHint:
      "Questi dati alimentano i prompt (brief Fase 1 + arricchimento Fase 2 assemblati). Puoi ritoccarli qui prima di generare.",
    recapToggleShow: "Mostra riepilogo dati",
    recapToggleHide: "Nascondi riepilogo dati",
    recapHint: "Apri il riepilogo solo se devi rivedere o correggere i dati di base prima della generazione.",
    readinessTitle: "Checklist copy (DOGMA)",
    readinessIntro: "Prima di generare, verifica questi punti per risultati più solidi.",
    readinessNomeOk: "Nome prodotto presente",
    readinessNomeKo: "Aggiungi il nome prodotto nel brief o qui",
    readinessKwOk: "Almeno una keyword inclusa (piano Fase 3 o brief)",
    readinessKwKo: "Completa Keyword Intelligence o aggiungi keyword nel brief",
    readinessBenefitOk: "Benefici o USP presenti (dopo Fase 2)",
    readinessBenefitKo: "Completa l’arricchimento strategico o aggiungi USP/benefici qui",
    phase3Badge: "Fase 4 · Generazione contenuti",
    fields: {
      nome: "Nome prodotto",
      categoria: "Categoria",
      keywordsPrimary: "Keyword nel brief — gruppo 1 (virgola)",
      keywordsSecondary: "Keyword nel brief — gruppo 2 (virgola)",
      keywordsFromPlan: "Keyword incluse dal piano (Fase 3)",
      keywordsFromPlanHint: "Elenco confermato in Keyword Intelligence; non modificabile qui.",
      usp: "USP / differenziazione",
      target: "Target cliente",
      brand: "Linee guida brand",
      priceTier: "Livello prezzo (tono)",
      features: "Caratteristiche tecniche (una per riga)",
      benefits: "Benefici principali (una per riga)",
      objections: "Obiezioni da gestire (una per riga)",
      reviews: "Insight recensioni (opzionale)",
    },
    tiers: {
      unknown: "Non specificato",
      entry: "Entry / accessibile",
      mid: "Mid-range",
      premium: "Premium",
    },
    sections: {
      seo_title: {
        label: "Titolo SEO",
        goal: "Massimizza chiarezza e CTR con keyword naturali, senza stuffing. Rispetta il limite caratteri.",
      },
      bullet_points: {
        label: "Bullet point",
        goal: "Cinque punti elenco conversion-oriented: benefici concreti, tono Amazon (non landing page).",
      },
      description: {
        label: "Descrizione",
        goal: "Testo lungo credibile, paragrafi brevi, USP e obiezioni integrate senza ripetizioni eccessive.",
      },
      keyword_strategy: {
        label: "Keyword backend",
        goal: "Search terms stile Seller Central IT: termini separati da spazio, copertura semantica, no slogan generici.",
      },
    },
    actions: {
      generate: "Genera questa sezione",
      regenerate: "Rigenera",
      copy: "Copia",
      copyAll: "Copia tutti",
      copied: "Copiato",
      saveOutput: "Salva bozza",
      savedOutput: "Bozza aggiornata.",
      saveProject: "Salva progetto",
      savedProject: "Progetto salvato e contrassegnato come completato.",
    },
    bullets: {
      itemLabel: "Bullet",
      itemPlaceholder: "Scrivi il bullet",
    },
    generationErrorHint:
      "Generazione non riuscita. Controlla la connessione e riprova tra qualche secondo. Se il problema continua, salva la bozza e aggiorna la pagina.",
    editorHint: "Modifica liberamente il testo generato prima di copiarlo o salvare.",
    validationTitle: "Controlli qualità",
    fromManualListingCta: "Apri generazione scheda",
  },
} as const;

export type ItCopy = typeof it;
