"""Istruzioni strutturali per generazione Brief Creativo (non sostituiscono DOGMA)."""

GALLERY_STRUCTURE = """
Devi produrre un unico testo in italiano, in formato piano (no asterischi, no markdown).

Struttura obbligatoria: esattamente 8 blocchi, uno per immagine, con queste intestazioni esatte su riga propria:
IMAGE 1 — Main image
IMAGE 2 — Problema / Soluzione
IMAGE 3 — Utilizzo reale
IMAGE 4 — Specifiche tecniche
IMAGE 5 — Differenziazione
IMAGE 6 — Dettagli qualità
IMAGE 7 — Fiducia / Sicurezza / Chiarezza prodotto
IMAGE 8 — Valore aggiunto / Bundle / Contenuto confezione

Per ogni blocco includi sempre queste righe etichettate (stesso ordine):
Nome immagine e ruolo:
Dimensione consigliata:
Cosa mostrare visivamente:
Messaggio breve possibile in grafica (max 6-8 parole, oppure "Nessuno" per IMAGE 1 se vietato):
Angolo di comunicazione:
Indicazioni pratiche per il grafico:
Errori da evitare:
Dati prodotto da valorizzare:

Per IMAGE 1 indica esplicitamente: sfondo bianco puro, solo prodotto in vendita, nessun testo overlay, icone, badge, elementi decorativi, scene lifestyle; prodotto grande e centrato; canvas 2000 x 2000 px, 1:1, JPEG ad alta risoluzione.

Parla al designer (tu devi, crea, evita), non al cliente finale.
"""

A_PLUS_STRUCTURE = """
Devi produrre un unico testo in italiano, formato piano (no asterischi, no markdown).

Includi un blocco iniziale che dichiara: A+ standard (non Premium A+).

Poi un blocco esplicito:
MODULO 4 — Video
Testo fisso: Modulo video escluso dal MVP del brief creativo. Non generare istruzioni video.

Poi i moduli con intestazioni su riga propria:
MODULO 1 — Hero image principale
MODULO 2 — Focus prodotto e benefici
MODULO 3 — Come funziona
MODULO 5 — Confronto prodotti
MODULO 6 — FAQ A+

Per MODULO 1 indica dimensioni desktop 1464 x 600 px e mobile 600 x 450 px.
Per MODULO 2 stesse dimensioni.
Per MODULO 3 indica quattro sotto-immagini 300 x 225 px con quattro messaggi distinti.

Per ogni modulo (tranne MODULO 4) includi:
Nome modulo:
Dimensioni richieste:
Obiettivo visivo:
Cosa deve mostrare il designer:
Testo breve suggerito IT (max 6-8 parole dove ha senso):
Guida layout:
Elementi da evidenziare:
Tono in base al livello prezzo del prodotto:
Errori da evitare:
Dati prodotto da usare:

MODULO 5: niente confronto aggressivo con competitor; preferire linea interna o struttura generica se mancano varianti.

Parla al designer, linguaggio operativo.
"""

FAQ_STRUCTURE = """
Devi produrre esattamente 5 coppie domanda-risposta in italiano, formato piano (no asterischi, no markdown).

Per ogni FAQ usa:
Domanda:
Risposta:

Regole risposta: rassicurante ma non promozionale aggressiva; pratica e concisa; nessun claim tecnico o certificazione inventata; nessuna CTA tipo acquista ora.
Usa brief, arricchimento, obiezioni, recensioni sintetizzate, specifiche e contesto d uso dai dati forniti.
"""


def system_preamble_for_area(area: str) -> str:
    if area == "gallery":
        return (
            "Sei un senior art director per listing Amazon Italia. "
            "Il tuo output e un brief di lavoro per un grafico, non copy marketing per il cliente.\n"
            + GALLERY_STRUCTURE
        )
    if area == "a_plus":
        return (
            "Sei un senior designer di moduli A+ Content Amazon (standard). "
            "Il tuo output e un brief operativo per il team creativo.\n"
            + A_PLUS_STRUCTURE
        )
    return (
        "Sei un copywriter tecnico per FAQ ecommerce Amazon. "
        "Il tuo output sono 5 FAQ chiare per scheda o modulo A+, non slogans.\n"
        + FAQ_STRUCTURE
    )
