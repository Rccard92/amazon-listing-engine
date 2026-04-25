# Keyword Intelligence Rules

## Metadata
- rules_id: keyword_intelligence_rules
- rules_version: v1
- scope: screening-classification-allocation

## Product Match Rules
- La keyword e valida solo se coerente con prodotto, categoria e attributi confermati.
- Una keyword con volume alto non deve essere approvata se non e semanticamente coerente.
- Le fonti di verita principali sono: product_brief, strategic_enrichment, attributi confermati e use case.
- Se la keyword esprime un tipo prodotto differente da quello rilevato, classificare come esclusa.
- Se la keyword implica logica/power source incompatibile, classificare come esclusa.

## Competitor Brand Exclusion Rules
- Mai includere brand competitor nei contenuti frontend.
- Mai includere brand competitor nei backend search terms.
- Se una keyword contiene brand competitor noto, classificarla come BRANDED_COMPETITOR con esclusione.

## Off Target Exclusion Rules
- Escludere query con intento non coerente (download gratis, prodotti digitali, ecc.).
- Escludere keyword di ricambi/accessori quando non coerenti con il prodotto centrale.
- Escludere keyword generiche ad alta ambiguita quando non guidano posizionamento chiaro.

## Uncertain Feature Verification Rules
- Se la keyword dipende da una caratteristica non confermata, non approvare automaticamente.
- Classificare in VERIFY_PRODUCT_FEATURE e richiedere conferma utente.
- Le keyword in verifica non entrano nel piano frontend/backend finche non confermate.

## Frontend Vs Backend Allocation Rules
- Frontend: keyword precise, pulite e centrali per posizionamento prodotto.
- Backend: varianti semantiche pertinenti meno eleganti per copy frontend.
- Backend deve complementare il frontend: evitare spreco spazio su keyword gia coperte bene nei contenuti.
- Non allocare mai keyword competitor/off-target nelle liste backend.

## Keyword Priority Logic
- High priority: match forte con prodotto e utilita commerciale diretta.
- Medium priority: keyword pertinente ma secondaria o long-tail.
- Low priority: keyword valida ma marginale per differenziazione.
- Una keyword troppo generica non deve diventare core keyword.

## Final Recommendation Logic
- Output pianificazione keyword deve includere:
  - core frontend keywords
  - support frontend keywords
  - backend reserved keywords
  - verify keywords
  - excluded keywords con motivo
- Le esclusioni devono essere sempre tracciate con reason type.
- Le raccomandazioni devono essere downstream-safe per title, bullets, description e backend terms.
