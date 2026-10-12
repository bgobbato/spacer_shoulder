# OPTIONS — Como fabricar o molde do espaçador umeral

Base: `RESEARCH.md` e notas `research/01`–`08`. Todas as opções usam **o mesmo gerador** (página
estática, parâmetros → espaçador → duas metades A/P). O que muda é o que sai da impressora, como
se esteriliza e como se enche. O escopo está travado (só úmero, forma de prótese anatômica, cabeça
lisa de referência normal, haste distal em dreno de tórax).

Comum a todas:
- Enchimento **a céu aberto**, metade por metade, como Klosterman (`01` §4.7); o excesso sai pela
  partição. Dreno de tórax distal sobre o fio de reforço.
- Espaçador moldado de **20–46 cm³** (`07` §7.5); molde em bloco de ~49–58 × 77–102 × 58–70 mm,
  **101–182 cm³ de material por metade** (spike; um molde de contorno gasta menos).
- Desmoldante: óleo mineral estéril (Klosterman) ou pomada de bacitracina (9 N × 105 N no teste de
  Beitler 2022; `05` §4). O silicone dispensa.
- Nada disso tem registro: é uso sob responsabilidade do cirurgião, com a documentação de `06` §6.

## Opção A — Molde rígido de PA12 em pó (MJF ou SLS), uso único, feito por bureau

| | |
|---|---|
| O que é | As duas metades impressas em PA12 (HP MJF HR PA 12 ou EOS PA 2200), sólidas, parede ≥ 8 mm, com as chaves e a sede do dreno. Uma por paciente |
| Prós | Único material comum que passou por vapor 121 °C, 134 °C e H₂O₂ com Δ 0,02–0,04 mm (Valls-Esteve 2023); HDT 175 °C a 0,45 MPa, bem acima do pico do cimento; tenaz (não quebra ao desmoldar); laudos USP VI / ISO 10993 do fabricante do pó (`05` §0, §2); bureaus no Brasil (`05` §9) |
| Contras | Superfície granulosa (Sa ≈ 28 µm, `05` §5) passa para a cabeça → lixar a cabeça de cimento ou alisar a cavidade (biocompatibilidade do alisamento NÃO VERIFICADA); poroso: absorve óleo, por isso uso único; depende de bureau (prazo e custo NÃO VERIFICADOS — pedir cotação) |
| Custo | Material: 200–360 cm³ de PA12 por molde (bloco). Preço por cm³ no Brasil: **NÃO VERIFICADO** |
| Tempo até o 1º protótipo | Gerador: etapas 1–6 do `PLAN.md`. Impressão: prazo do bureau (NÃO VERIFICADO) |
| Esterilização | Vapor 121 °C ou 134 °C, ou H₂O₂ (todos validados dimensionalmente em PA12 por Valls-Esteve 2023). No Brasil, o CME só processa produto regularizado (RDC 15/2012 art. 9º) → consulta à CCIH/vigilância (`06` §2.4) |
| Risco | Médio. Maior incerteza: acabamento articular e aprovação institucional da esterilização |

## Opção B — Mestre impresso → molde de silicone em duas metades

| | |
|---|---|
| O que é | O gerador exporta o **espaçador positivo** (mestre) e uma **caixa de vazamento** bipartida; o silicone de adição (grau médico/odontológico) é vazado em duas etapas, formando as metades A/P com as chaves moldadas |
| Prós | Silicone autoclavável (140 °C/60 min publicado, Kong 2021) ou EtO; **dispensa desmoldante**; desmolda flexível, sem risco de quebrar o espaçador; custo de US$ 30–70 por molde em séries de países de renda média (`03` §1); o mestre pode ser impresso em qualquer material (não vai ao campo) |
| Contras | Passo extra de vazamento e cura do silicone (tempo NÃO VERIFICADO); silicone macio deixa a superfície menos precisa e deforma com a pressão do cimento (Chang 2020, `05` §5); precisa de câmara de vácuo para evitar bolhas no silicone (inferência, NÃO VERIFICADO); o fio de reforço precisa ser centrado pelo próprio silicone |
| Custo | Silicone + mestre + caixa; o mais barato por caso depois do método pronto |
| Tempo até o 1º protótipo | +1 etapa no gerador (caixa de vazamento) + aprendizado do vazamento |
| Esterilização | Vapor (silicone de adição tolera) ou EtO |
| Risco | Médio. Maior incerteza: precisão da cabeça e processo manual de vazamento |

## Opção C — Molde rígido de resina SLA biomédica (Formlabs BioMed Amber)

| | |
|---|---|
| O que é | Metades impressas em SLA com resina ISO 10993, sólidas |
| Prós | **Melhor acabamento** direto do molde (Sa 6,7–8,5 µm em mSLA); resina já publicada como molde de PMMA (Beitler 2022); autoclave 121 °C/30 min ou 134 °C/20 min pela IFU (`05` §2) |
| Contras | **HDT 78 °C (0,45 MPa)** contra núcleo de cimento > 100 °C numa cabeça maciça: risco de fluência sob o grampo (NÃO VERIFICADO); frágil — resina DLP comum quebrou ao desmoldar (Nguyen 2023); 134 °C tira resistência de resina irmã (Surgical Guide −36 %); exige Form 3B/4B e tanque dedicado; resina a R$ 3.355/L, sem estoque em 25/set/2026 (`05` §9) |
| Custo | Resina + impressora SLA biomédica |
| Tempo até o 1º protótipo | Rápido se houver impressora SLA; senão, compra |
| Esterilização | Vapor 121 °C (preferir) |
| Risco | **Alto** para a cabeça grande (calor + fragilidade). Boa para peças pequenas |

## Opção D — Molde de PETG em FDM, feito em casa (protótipo e bancada)

| | |
|---|---|
| O que é | Metades impressas em PETG na impressora de mesa, 100 % de preenchimento, parede ≥ 8 mm |
| Prós | Barato e imediato; serve para conferir encaixe, chaves, sede do dreno, desmoldagem, marcas de camada na cabeça e **medir a temperatura com termopar** (`05` §0) |
| Contras | Tg ≈ 80 °C contra núcleo > 100 °C; **deforma na autoclave**; filamento comum sem certificação; degraus de camada na calota (Sa 20–27 µm em 15–30°) (`05` §2, §5) |
| Custo | O menor |
| Tempo até o 1º protótipo | Horas, depois que o gerador existir |
| Esterilização | Só H₂O₂ ou EtO (PETG estável em H₂O₂: RMS 0,093 → 0,112 mm, Popescu 2025) — **não recomendado para o centro cirúrgico** |
| Risco | Baixo como bancada; **inaceitável como molde clínico** sem teste térmico |

## Comparação

| Critério | A PA12 | B Silicone | C SLA BioMed | D PETG |
|---|---|---|---|---|
| Aguenta o calor do cimento | sim (HDT 175 °C) | sim | duvidoso (78 °C) | não garantido (Tg 80 °C) |
| Autoclave | sim (121/134) | sim | 121 °C | não |
| Acabamento da cabeça | granuloso, lixar | médio | o melhor | degraus |
| Quebra ao desmoldar | não | não (flexível) | risco | baixo |
| Laudo de biocompatibilidade | do pó (USP VI / ISO 10993) | depende do silicone | ISO 10993 | não |
| Custo por caso | médio (NÃO VERIFICADO) | baixo | médio | muito baixo |
| Passos extras | nenhum | vazar silicone | pós-cura da resina | nenhum |
| Uso previsto | **centro cirúrgico** | alternativa clínica | peças pequenas | **bancada** |

## Recomendação

**Opção A (PA12 em pó, uso único) para o centro cirúrgico, precedida da Opção D (PETG) na bancada.**

Por quê:
1. O risco central do molde impresso é o calor do cimento numa cabeça maciça de 17–27 cm³
   (`RESEARCH.md` §8). Entre os materiais comuns, só o PA12 tem margem térmica folgada **e**
   estabilidade dimensional medida nos três métodos de esterilização.
2. É rígido e tenaz: aceita o grampo e a extração com impactor que Klosterman precisou, sem o risco
   de quebra da resina.
3. Não acrescenta etapas manuais na sala (o silicone acrescenta).
4. A desvantagem (superfície granulosa) é corrigível: Klosterman já lima a rebarba "com atenção à
   superfície articular"; a cavidade da cabeça pode ser alisada antes (a validar).
5. O mesmo gerador serve para D, A e B; começar pelo PETG permite testar encaixe, desmoldagem e
   temperatura com cimento de verdade antes de gastar com bureau.

**Plano B**: se a bancada mostrar cabeça áspera demais em PA12, testar a Opção B (silicone sobre
mestre), que só exige acrescentar a caixa de vazamento ao gerador.

**Reforço metálico** (vale para todas): o molde prevê o **fio de 2,5 mm com ponta em bola**
(Klosterman) centrado no plano de partição; a bitola (2,5 mm, Steinmann 2,4–3,2 mm, haste de Rush) é
parâmetro e decisão do cirurgião (`04` §8).
