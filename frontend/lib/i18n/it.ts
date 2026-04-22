/**
 * Testi interfaccia in italiano (MVP centralizzato).
 * Nomi variabili e chiavi restano in inglese dove serve al codice.
 */

export const it = {
  brand: {
    short: "ALE",
    name: "Amazon Listing Engine",
    tagline: "Motore per inserzioni Amazon",
  },
  nav: {
    home: "Home",
    newListing: "Crea da zero (avanzato)",
    improve: "Migliora scheda esistente",
    competitor: "Crea da prodotto simile",
    listingGeneration: "Generazione scheda",
    history: "Cronologia",
    projects: "Progetti salvati",
    cta: "Crea da prodotto simile",
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
      "Crea nuove schede prodotto Amazon partendo da un prodotto simile, con un percorso guidato e adatto anche ai non esperti.",
    heroBody:
      "Parti da una pagina Amazon simile per ridurre il rischio di pagina bianca: il sistema precompila i dati utili e ti guida solo sulle decisioni davvero strategiche per il tuo brand.",
    workflowsHeading: "Cosa vuoi fare adesso?",
    workflowsIntro:
      "Scegli uno dei percorsi guidati: il primo e consigliato parte da un prodotto simile e ti aiuta a costruire una scheda piu' solida con meno attrito.",
    benefitsHeading: "Perché usare questa piattaforma",
    benefitsIntro:
      "Ti aiutiamo a lavorare sulle schede prodotto in modo più ordinato, con meno dubbi e decisioni più rapide.",
    benefits: [
      {
        title: "Percorso guidato per i testi",
        description:
          "Compili pochi campi alla volta con esempi e spiegazioni, così è più facile ottenere una scheda prodotto chiara.",
      },
      {
        title: "Analisi mirata di una pagina Amazon",
        description:
          "Parti da un link specifico per capire cosa migliorare senza confusione e senza attività massive.",
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
        href: "/competitor",
        title: "Crea da prodotto simile",
        description:
          "Incolla un prodotto Amazon simile: estraiamo i segnali utili, precompiliamo una bozza e ti guidiamo sulle differenze che contano.",
        badge: "Consigliato",
        nextHint:
          "Parti da un URL, rivedi i campi precompilati e conferma le scelte prima della generazione finale.",
        cta: "Inizia da prodotto simile",
      },
      {
        href: "/improve",
        title: "Migliora scheda prodotto esistente",
        description:
          "Incolla il link della tua scheda Amazon e individua in modo guidato cosa migliorare in titolo, punti elenco e contenuti.",
        badge: "Miglioramento",
        nextHint:
          "Ti chiediamo solo il link e il tuo obiettivo principale: da lì parti subito con suggerimenti utili.",
        cta: "Migliora scheda",
      },
      {
        href: "/new-listing",
        title: "Crea da zero (avanzato)",
        description:
          "Compila manualmente tutti i dati del prodotto. Percorso utile se hai gia' strategia, dati e keyword molto chiari.",
        badge: "Avanzato",
        nextHint:
          "Percorso completo ma meno assistito: consigliato solo se non hai un prodotto simile da cui partire.",
        cta: "Apri creazione manuale",
      },
    ],
  },
  createFromSimilar: {
    title: "Crea una nuova scheda da prodotto simile",
    subtitle:
      "Incolla un prodotto Amazon simile: analizziamo la pagina, precompiliamo una bozza strategica e ti chiediamo solo le scelte specifiche del tuo brand.",
    actions: {
      analyze: "Analizza e precompila",
      regenerate: "Rianalizza URL",
      continue: "Continua con bozza guidata",
    },
    hints: {
      partialExtraction:
        "Estrazione parziale: alcuni dati dalla pagina potrebbero mancare. Verifica i campi e prosegui con cautela.",
      aiSoftFailure:
        "L'analisi AI strutturata non è andata a buon fine; abbiamo comunque salvato l'estrazione dalla pagina e i suggerimenti di base.",
      dismissWarning: "Ho capito, continuo",
    },
    errors: {
      generic: "Non sono riuscito a completare l'analisi. Controlla l'URL e riprova.",
      unknownServer: "Il server ha restituito un errore non strutturato. Riprova tra poco.",
    },
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
    title: "Nuova inserzione",
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
  },
  improve: {
    title: "Migliora un’inserzione esistente",
    subtitle:
      "Incolla il link della tua scheda Amazon e dicci cosa vuoi migliorare. Analizziamo una pagina alla volta, in modo controllato.",
    steps: {
      url: {
        title: "Link della scheda Amazon",
        description: "Usa l’indirizzo completo della pagina prodotto che vuoi migliorare.",
        intro:
          "Apri la scheda su Amazon, copia l’indirizzo dalla barra del browser e incollalo qui. Verifica che sia proprio il prodotto giusto.",
        sectionHelp: {
          title: "Perché solo un link",
          body: "Così ci concentriamo su una scheda alla volta, evitiamo raccolte massive di pagine e rispettiamo le regole d’uso di Amazon.",
        },
        field: {
          label: "Indirizzo (URL) della pagina prodotto",
          hint: "Deve iniziare con https:// e contenere di solito /dp/ seguito dal codice articolo.",
          help: {
            title: "Dove trovarlo",
            body: "Sul sito Amazon apri il tuo prodotto. L’URL in alto è quello giusto. Se hai dubbi, incolla quello che vedi dopo aver cliccato sul titolo in elenco risultati.",
          },
        },
      },
      scope: {
        title: "Su cosa concentrarci",
        tabsAriaLabel: "Area di lavoro per il miglioramento",
        description: "Scegli se vuoi partire dal testo visibile ai clienti o dalle parole chiave.",
        intro:
          "Puoi cambiare tab in qualsiasi momento. Più indicazioni ci dai, più i suggerimenti saranno aderenti al tuo obiettivo.",
        sectionHelp: {
          title: "Copy e parole chiave",
          body: "Copy è ciò che legge il cliente (titolo, punti elenco, descrizione). Parole chiave sono le ricerche con cui vuoi essere trovato: servono a collegare scheda e domanda dei clienti.",
        },
        tabs: {
          copy: "Testo della scheda (copy)",
          keywords: "Parole chiave",
        },
        copyField: {
          label: "Cosa vuoi migliorare nel testo?",
          hint: "Esempi: titolo poco chiaro, bullet troppo lunghi, tono troppo tecnico.",
          placeholder:
            "Es. voglio un titolo più corto e che spieghi subito il beneficio principale; i bullet sono ripetitivi…",
          help: {
            title: "Come compilare",
            body: "Scrivi in modo libero: cosa non ti convince, cosa vorresti che capisse il cliente a colpo d’occhio, se hai vincoli di marca o legali da rispettare.",
          },
        },
        kwField: {
          label: "Parole chiave da privilegiare o evitare",
          hint: "Elenco separato da virgole: ok anche note tipo “da evitare: …”.",
          placeholder:
            "es. organizer cavi scrivania, gestione cavi ufficio — da evitare: regalo, omaggio",
          help: {
            title: "Primary, secondarie, esclusi",
            body: "Indica le ricerche importanti e, se serve, quelle fuori target (es. regalo se non vendi idea regalo). Più tardi potremo organizzarle in modo strutturato.",
          },
        },
      },
      result: {
        title: "Risultato dell’analisi",
        description: "Qui vedrai il riepilogo e i suggerimenti quando il motore di analisi sarà collegato.",
        intro:
          "Per ora quest’area è vuota di proposito: ti mostra dove appariranno punteggi, idee di miglioramento e priorità. Nessun errore da parte tua.",
        emptyTitle: "Analisi non ancora disponibile",
        emptyBody:
          "Quando il servizio di analisi sarà attivo, qui troverai un riepilogo chiaro: cosa va bene, cosa correggere prima e cosa puoi fare dopo. Intanto puoi completare i passaggi sopra e salvare la bozza.",
      },
    },
  },
  competitor: {
    title: "Nuova scheda ispirata a un concorrente",
    subtitle:
      "Usa la pagina di un altro venditore solo come riferimento: costruiremo una proposta con il tuo posizionamento, non una copia.",
    steps: {
      url: {
        title: "Pagina del concorrente",
        description: "Incolla un solo link alla scheda che vuoi prendere come riferimento.",
        intro:
          "Serve l’indirizzo completo della scheda concorrente. Non serve che sia lo stesso identico prodotto: può essere un alternativo molto simile.",
        sectionHelp: {
          title: "Uso lecito del confronto",
          body: "Analizziamo una pagina pubblica alla volta per capire messaggi e struttura, non per copiare testi. Il tuo obiettivo è differenziarti: lo chiederemo al passo successivo.",
        },
        field: {
          label: "Indirizzo (URL) della scheda concorrente",
          hint: "Stesso formato del link Amazon che usi per migliorare la tua scheda.",
          help: {
            title: "Quale link usare",
            body: "Apri la scheda del concorrente su Amazon e copia l’URL dalla barra degli indirizzi. Verifica di essere sul prodotto giusto prima di incollare.",
          },
        },
      },
      positioning: {
        title: "Come ti vuoi posizionare",
        description: "Spiega chi è il tuo cliente ideale e perché dovrebbe scegliere te.",
        intro:
          "Queste informazioni servono a generare testi distintivi. Non servono formule marketing: bastano frasi sincere sul tuo vantaggio.",
        sectionHelp: {
          title: "Differenziarsi in pratica",
          body: "Più sei specifico su pubblico e vantaggio (qualità, servizio, garanzia, design), più il testo potrà essere credibile e aderente al tuo brand.",
        },
        audience: {
          label: "Cliente ideale",
          hint: "Chi comperebbe da te e non dal concorrente? Età, contesto, problema che risolve.",
          example: "Professionisti che lavorano da casa e vogliono una postazione ordinata",
          help: {
            title: "Cosa scrivere",
            body: "Pensa a una persona tipo: non serve un segmento perfetto, ma un’idea chiara di chi vuoi convincere.",
          },
        },
        advantage: {
          label: "Il tuo vantaggio principale",
          hint: "Una o due frasi: cosa offri di concreto in più (o diverso).",
          example: "Materiali certificati, imballo più robusto, assistenza in italiano entro 24 ore",
          help: {
            title: "Perché è importante",
            body: "Il confronto con il concorrente serve a evidenziare il tuo plus. Evita slogan generici: preferisci fatti verificabili.",
          },
        },
        narrative: {
          label: "Messaggio o tono desiderato",
          hint: "Facoltativo ma utile: tono formale/cordiale, enfasi su design, sostenibilità, ecc.",
          placeholder:
            "Es. voglio risultare affidabile e tecnico, meno ‘marketing’ del concorrente; enfatizzare garanzia 3 anni…",
          optional: true,
          help: {
            title: "Angolo narrativo",
            body: "Qui indichi come vuoi sembrare agli occhi del cliente: serio, friendly, premium, ecc. Aiuta a mantenere coerenza tra titolo e punti elenco.",
          },
        },
      },
      result: {
        title: "Anteprima della nuova scheda",
        description: "Qui comparirà la proposta di testi quando la generazione sarà attiva.",
        intro:
          "Non vedere ancora contenuti è normale: stiamo preparando il flusso. Completa i dati sopra così non dovrai ripetere il lavoro.",
        emptyTitle: "Proposta non ancora pronta",
        emptyBody:
          "Quando il motore di generazione sarà collegato, qui troverai titolo, punti elenco, testi di supporto e note su parole chiave e conformità. Puoi salvare la bozza e tornare più tardi.",
      },
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
    loadStrategyError: "Impossibile caricare la strategia da questo elemento. Compila i campi manualmente o riapri da una bozza competitor.",
    workItemHint: "Collegata a bozza cronologia. Puoi salvare gli output nella stessa attività.",
    strategyPanelTitle: "Strategia prodotto confermata",
    strategyPanelHint:
      "Questi dati alimentano i prompt. Arrivano dal percorso competitor o li modifichi qui prima di generare.",
    fields: {
      nome: "Nome prodotto",
      categoria: "Categoria",
      keywordsPrimary: "Keyword primarie (virgola)",
      keywordsSecondary: "Keyword secondarie (virgola)",
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
      saveOutput: "Salva output nella bozza",
      savedOutput: "Output salvato nella bozza",
    },
    editorHint: "Modifica liberamente il testo generato prima di copiarlo o salvare.",
    validationTitle: "Controlli qualità",
    fromCompetitorCta: "Apri generazione scheda",
  },
} as const;

export type ItCopy = typeof it;
