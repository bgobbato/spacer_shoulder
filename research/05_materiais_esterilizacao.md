# 05 — Materiais, impressão e esterilização do molde do espaçador umeral

> Pesquisa paralela (fora do produto SchulterPlan). Tema: qual material imprimir para um molde
> bipartido (anterior/posterior) que recebe cimento PMMA com antibiótico no campo estéril, e como
> esterilizar, limpar e embalar. Data: 25/set/2026.
> Convenção: **NÃO VERIFICADO** = não achei fonte primária que confirme; é inferência ou
> estimativa de engenharia e precisa de teste de bancada.

---

## 0. Resposta curta (ranking)

**(a) Protótipo rápido (bancada, sem esterilizar, vazar cimento de verdade para testar desmoldagem):**

1. **PETG FDM, 100 % de preenchimento, parede ≥ 6 mm** — barato, Tg ≈ 80 °C (bem acima do PLA),
   estável em VH2O2. Serve para testar encaixe, desmoldagem e marca de camada na cabeça.
2. **Resina SLA comum ou BioMed Amber** — para julgar o acabamento da cabeça (Sa de SLA é o menor
   entre as tecnologias). Resina de impressora DLP comum é frágil: um grupo quebrou o molde ao
   tirar o espaçador.
3. **PLA FDM** — só para checar geometria/encaixe (ou vazar gesso/silicone). Com cimento, o PLA
   amolece: Tg 52–60 °C contra um exotérmico que passa de 85 °C em moldes de espaçador.

**(b) Uso no centro cirúrgico (molde de uso único, por paciente):**

1. **PA12 em pó (HP MJF "High Reusability PA 12" ou EOS PA 2200 SLS)** — tem dados de
   biocompatibilidade do fabricante (USP classe VI + ISO 10993-5/-10/-11). Aguenta autoclave
   121 °C e 134 °C e também H2O2 com variação de 0,02–0,04 mm. HDT de 175 °C a 0,45 MPa, então
   passa com folga pelo exotérmico. É tenaz, não quebra. **Contra:** superfície granulosa
   (Sa ≈ 28 µm em SLS) que passa para a cabeça de cimento, e porosidade que absorve óleo e
   sujeira. Tem de ser uso único e pedir a um bureau (há no Brasil).
2. **Formlabs BioMed Amber (SLA)** — o melhor acabamento. ISO 10993-5/-10/-11 + pirogênio.
   Autoclave 121 °C/30 min ou 134 °C/20 min. **Já foi usada e publicada como molde de PMMA**
   (Beitler 2022). **Contra:** HDT de 78 °C a 0,45 MPa (65 °C a 1,8 MPa) contra uma massa de
   cimento grande; é frágil; e a resina irmã (Surgical Guide) perde resistência a 134 °C.
   Preferir 121 °C, com saída (draft) generosa e óleo desmoldante.
3. **PEEK grau médico (FFF) ou ULTEM 1010 grau certificado (FDM Stratasys)** — maior margem
   térmica e aceita autoclave repetida (PEEK i4 3DF: 134–137 °C, RMSE de 0,16 mm, sem diferença
   significativa). **Contra:** exige impressora de alta temperatura e é caro. Vale se o molde for
   reutilizável.
4. **Silicone de adição (grau odontológico/médico), vazado sobre um "master" impresso** —
   autoclavável (140 °C/60 min já publicado) ou EtO. Não precisa de desmoldante e desmolda
   flexível. **Contra:** passo extra. O silicone macio deixa a superfície menos precisa (Chang 2020).
5. **PC-ISO (Stratasys)** — ISO 10993/USP VI (da resina "em estado bruto"), HDT de 133 °C.
   "Até 3 ciclos de autoclave". Um PC FDM genérico, porém, deformou 3,6 mm RMS em autoclave: usar
   VH2O2 ou EtO.
6. **PETG só com VH2O2/EtO** — deformação dimensional pequena (< 0,2 mm), mas Tg ≈ 80 °C contra o
   exotérmico de uma cabeça maciça, e sem certificação na maioria dos filamentos.
   **PLA: não recomendado para o CC.**

---

## 1. O que o molde precisa aguentar

| Solicitação | Valor | Fonte |
|---|---|---|
| Autoclave (vapor) | 121 °C por 20–30 min ou 134 °C por 4–20 min, 2,5–3 atm | Valls-Esteve 2023; TDS BioMed Amber |
| VH2O2 / plasma (STERRAD, V-PRO) | 45–60 °C, ~28–60 min, baixa pressão | Popescu 2025; Valls-Esteve 2023; Fuentes 2025 (ISO 22441:2022) |
| Óxido de etileno | 55 °C, 60–180 min + aeração (ex.: 5 h) | Fuentes 2025 (ISO 11135:2014); relatório Formlabs |
| Exotérmico do PMMA em molde de espaçador (silicone comercial de joelho) | pico de **85,1 °C (fêmur)** e **115,2 °C (tíbia)**; nos mais quentes, **> 100 °C por 3 min**; Simplex mais quente que Palacos | Carli 2018 (J Arthroplasty) |
| Limite da norma do cimento | ISO 5833: temperatura máxima 90 ± 5 °C no corpo de prova padrão, pega entre 3 e 15 min | fonte secundária (resultado de busca); **norma não lida — confiança média** |
| Variação de volume do cimento | dilata no pico térmico e depois contrai; retração volumétrica de 2–5 % (manual) e 3–6 % (vácuo), segundo a revisão citada em Boote 2020 | Boote 2020 |
| Monômero MMA líquido em contato com a parede | solvente (éster) antes de polimerizar | ver §4 |

**Estimativa de massa (NÃO VERIFICADO, cálculo próprio):** uma calota esférica de Ø 52 mm com
altura de 20 mm tem ~24 mL (Ø 56 × 22 mm: ~31 mL). Somando colo e corpo metafisário, a peça
proximal fica na ordem de 40–70 mL, ou seja, 1 a 2 pacotes de 40 g. É uma massa **tão ou mais
espessa que o espaçador tibial de Carli**. Conclusão: **espere o núcleo passar de 100 °C** e a
parede do molde ficar bem acima de 60 °C. A temperatura na interface molde-cimento **não foi
medida em nenhuma fonte que achei** e precisa de termopar no protótipo.

---

## 2. Tabela material × esterilização × calor

HDT = temperatura de deflexão sob carga. Δ = variação dimensional medida após o ciclo.

| Material (processo) | Tg / HDT | Vapor 121 °C | Vapor 134 °C | VH2O2 / plasma | EtO / gama | Biocompatibilidade declarada | Fontes |
|---|---|---|---|---|---|---|---|
| **PLA** (FDM) | Tg 52,6–57 °C | deforma e cristaliza (18,5 → 39,3 %); peças ≥ 10 mm de Ø mantêm forma (desvio de eixo de 0,1 mm), peças < 5 mm entortam | não (excluído por Tg) | Oth: < 0,2 mm; Valls-Esteve: −0,007 mm; **Popescu: RMS de 0,093 → 0,508 mm (o pior)**; fica mais frágil (+22 % UTS, menos ductilidade) | EtO: +22 % UTS, fica frágil; gama: quase inalterado | nenhuma no filamento comum | Pérez-Davila 2022; Neijhoft 2023; Oth 2019; Popescu 2025; Fuentes 2025; Charasseangpaisarn 2022 |
| PLA recozido (embutido em RTV, 120 °C/60 min) | — | — | "reteve a forma" (sem métrica completa) | — | — | — | Chiscop 2025 |
| **PETG** (FDM) | Tg ~80 °C (PETG-CF 80 °C; CPE 82 °C) | "deformação severa" | "deformação severa" | **RMS de 0,093 → 0,112 mm (estável)**; Oth < 0,2 mm | EtO: resistência estável | Lattice "Medical PETG": ISO 10993-5 do granulado | Popescu 2025; Oth 2019; Fuentes 2022/2025; Lattice |
| PC genérico (FDM, Bambu) | — | **RMS de 0,127 → 3,642 mm** | idem | RMS de 0,117 mm (estável) | — | — | Popescu 2025 |
| **PC-ISO** (FDM Stratasys) | HDT 133 °C (0,45 MPa) / 127 °C (1,8 MPa); Tg 161 °C | "até 3 ciclos de autoclave sem perda de função" | idem | — | gama e EtO | ISO 10993 / USP VI **"em estado bruto"** (resina, não a peça) | datasheet PC-ISO; Stratasys Direct |
| ABS (FDM) | Tg ~105 °C | não | não | ABS-M30i: guias com 0,003 ± 0,057 mm; 114 pacientes, 7 % de ISC (comparável à literatura) | — | ABS-M30i: ISO 10993/USP VI | Toro 2021; Shea 2020; Stratasys Direct |
| Nylon FDM (PA, PA6-CF) | higroscópico | "visivelmente deformado" | idem | PA: RMS de 0,348 mm; PA6-CF: 0,313 mm | — | — | Popescu 2025 |
| **PA12 SLS** (3D Systems/EOS) | PA 2200: fusão 176 °C, Vicat 163 °C | **+0,042 mm** | **+0,024 mm** | **−0,028 mm** | — | PA 2200: USP classe VI (121 °C), ISO 10993-5, -10 (sensibilização e irritação) | Valls-Esteve 2023; EOS reg. info; datasheet EOS |
| **PA12 MJF** (HP HR PA 12) | HDT 175 °C (0,45 MPa); 95–106 °C (1,82 MPa); fusão 187 °C | — (ver SLS) | — | — | — | USP classe I–VI + FDA "intact skin"; ISO 10993-5, -10, -11, USP <88> implantação muscular — **só com o pós-processo da HP** | declaração HP; datasheet HP |
| **BioMed Amber** (SLA Formlabs) | HDT 78 °C (0,45 MPa) / 65 °C (1,8 MPa) | **121 °C/30 min (IFU)** | **134 °C/20 min (IFU)**; 5 ciclos a 132 °C/4 min: Δ < 100 µm, sem perda mecânica | **não listado no TDS (NÃO VERIFICADO)** | EtO 55 °C/180 min, gama 29–31 kGy, e-beam 35 kGy: Δ < 100 µm | ISO 10993-5, -10 (irritação e sensibilização), -11, pirogênio USP <151>; fabricada em ISO 13485 | TDS e relatório de esterilização Formlabs |
| Surgical Guide (SLA Formlabs) | — | Δ não significativo; +14 % de tração | Δ significativo (−0,072 / −0,041 mm); **−36 % de tração** | −0,059 mm | — | contato com mucosa < 24 h | Sîrbu 2026; Valls-Esteve 2023 |
| BioMed Clear / White / Black | HDT 67–68 °C (0,45 MPa) | sim | sim (134 °C/20 min) | — | gama, EtO, e-beam | ISO 10993 | guia Formlabs |
| BioMed Durable | HDT 46 °C | só vapor validado | — | — | "em andamento" | ISO 10993, USP VI | guia Formlabs |
| MED610 (PolyJet) | — | +0,342 mm | **+1,684 mm** | −0,055 mm | EtO | ISO 10993-3, -5, -10 | Valls-Esteve 2023; Stratasys Direct |
| **PEEK** (FFF, VESTAKEEP i4 3DF) | — | — | **134–137 °C/18 min: RMSE 0,16 mm, p > 0,05** | — | — | grau implante ASTM F2026 | Sharma 2023; Evonik |
| **ULTEM 1010** (FDM, grau certificado) | HDT/Tg **NÃO VERIFICADO** (não obtive o datasheet) | "excelente para esterilização a vapor repetida" | idem | — | gama | ISO 10993/USP VI + NSF 51 (só o grau certificado) | Stratasys Direct; suporte Stratasys |
| **Silicone de adição** (moldado sobre master) | — | 140 °C/60 min (Kong 2021); silicone prensado autoclavado e reutilizado (Ganji 2024) | — | — | EtO sem efeito relevante (Nguyen 2023) | Zhermack elite HD+ (odontológico); silicone industrial foi descartado por risco de toxicidade | Kong 2021; Ganji 2024; Nguyen 2023 |

**Leitura da tabela**

- **Termoplásticos de FDM "de mesa" (PLA, PETG, ABS, PC, nylon) não suportam autoclave.** Há
  três estudos independentes (Popescu 2025, Valls-Esteve 2023, Pérez-Davila 2022). Eles vão para
  VH2O2 ou EtO. Mesmo assim, o PLA é o que mais piora em VH2O2 (Popescu).
- **PA12 em pó é o único material comum que passou nos três ciclos** (121, 134 e VH2O2) com
  Δ < 0,05 mm (Valls-Esteve). Tabela 12 do artigo: "PA12 é um bom candidato… para guias de corte e
  posicionamento".
- **Resinas SLA biomédicas toleram autoclave,** mas 134 °C custa resistência (Surgical Guide:
  −36 %). Prefira **121 °C** ou VH2O2 quando o fabricante permitir.

---

## 3. Calor do cimento contra o material do molde

- **PLA:** Tg de 52,6 °C (Charasseangpaisarn 2022). A 55 °C a amostra fletiu sem quebrar. Um
  grupo de cranioplastia fez o master em PLA e **vazou um molde de silicone** justamente porque o
  PLA não aguenta autoclave (PMC9473838). **Não serve como molde de cimento maciço.**
- **Resinas SLA biomédicas (HDT de 65–78 °C):**
  - Pöppe 2022 (cranioplastia): moldes de Surgical Guide e Dental SG, autoclavados a 134 °C por
    ≥ 20 min, com ~60 mL de Palacos R+G. Os autores disseram que o aquecimento do PMMA "não afetou
    a forma nem a estrutura" dos moldes.
  - Beitler 2022 usou BioMed Amber "pelo alto ponto de fusão", evitando o problema do exotérmico,
    mas com hemisférios de só Ø 25 mm (~4 mL).
  - **Nenhum dos dois é uma cabeça maciça de Ø 50 mm.** Uma placa de crânio é fina e dissipa
    calor. **Risco real de fluência sob o aperto dos parafusos** (NÃO VERIFICADO; teste com
    termopar).
- **PA12, PC-ISO, PEEK e ULTEM têm HDT ≥ 127 °C:** margem confortável contra 85–115 °C.
- **Espessura de parede e preenchimento (heurística de engenharia, NÃO VERIFICADO
  experimentalmente):**
  - Polímero conduz pouco calor, então a superfície interna do molde chega perto da temperatura
    da superfície do cimento, **qualquer que seja a espessura**. Por isso a escolha é pelo
    **material (HDT)**, não pela parede.
  - A parede grossa serve para **rigidez sob o aperto** e para não fletir. Proposta:
    - FDM: **≥ 6–8 mm, preenchimento de 100 %** (Popescu imprimiu a 100 %, 3 perímetros).
    - SLA: ≥ 4–5 mm, **sólido** (não oco, para não prender resina líquida).
    - PA12: ≥ 3–4 mm, sólido.
    - Nervuras externas e flanges de parafuso.
  - Neijhoft 2023 dá uma referência útil: em PLA a 121 °C, seções ≥ 10 mm mantiveram a forma e
    seções de 1–3 mm entortaram.
- **Aperto:** parafuso com borboleta ou grampo, torque manual. Aperto excessivo gera tensão e, com
  a parede quente, fluência (NÃO VERIFICADO). Kohl 2009: a **dilatação do PMMA na polimerização
  aumenta a pressão interna** e melhora o acabamento. Logo, o molde precisa resistir a essa
  pressão, e o respiro/canal de injeção deixa sair o excesso.

---

## 4. Química: monômero MMA e desmoldagem

- **Aderência do cimento ao molde impresso é o problema clínico nº 1** (Beitler 2022). Força de
  extração em molde de BioMed Amber autoclavado:
  - **Pomada de bacitracina (base vaselina): 9,1 ± 6,7 N**, a única significativamente menor que
    o controle (p = 0,0123); "às vezes o cimento simplesmente caía".
  - Óleo mineral: 104,9 ± 69,9 N.
  - Gel lubrificante aquoso: 147,8 N.
  - Controle sem nada: 339,3 ± 305,2 N.
  - Gel de ultrassom: 474,1 N (pior).
  - **Lubrificantes à base de água são ruins:** a água evapora durante a cura.
- **Na técnica de referência (Klosterman 2021):** óleo mineral nas duas metades do molde e dentro
  do dreno torácico, descrito como "chave" para tirar o espaçador. A pega leva ~16 min (variável).
  Rebarbas se acertam com lima.
- **Outros desmoldantes publicados:** óleo de parafina (Zheng 2023, molde de náilon), "óleo
  neutro" (Pöppe 2022), parafina estéril (Tel 2021, via Formlabs). **O silicone dispensa
  desmoldante** (Nguyen 2023; Ganji 2024).
- **Fragilidade:** Nguyen 2023 descartou molde de resina DLP. A baixa elasticidade da resina,
  somada à dilatação do PMMA, dificultou tirar o espaçador e **quebrou o molde**.
  - Implicação: molde rígido precisa de **plano de partição passando pelo equador da esfera, zero
    retenção (undercut), saída de 1–3° no corpo** e fendas para alavanca. Os valores de saída são
    NÃO VERIFICADO.
- **Ataque do MMA ao polímero do molde:**
  - A Covestro (Makrolon) avisa que PC sofre stress cracking com vários solventes polares e não
    lista o MMA. Um resumo de busca atribuiu à literatura do Makrolon que "ésteres atacam o PC".
    O MMA é um éster → **risco plausível de fissura em PC** (NÃO VERIFICADO).
  - Uma tabela genérica (GTeek) classifica o MMA como "excelente" com PEEK e PTFE, "bom" com PP,
    PET/PETG e silicone, e "limitado" com nylon e PC. **A tabela é pouco confiável:** diz "bom"
    para PMMA × MMA, e o MMA dissolve PMMA.
  - Na prática, BioMed Amber, Surgical Guide, náilon impresso e silicone têm uso publicado com
    cimento sem relato de ataque.
  - **Ação:** fazer um teste de bancada com um cupom de cada material e 1 pacote de cimento.
- **Pós-cura e autoclave da resina:** Beitler viu **molde deformado quando o IPA não evaporou
  antes da pós-cura/autoclave**. Protocolo que usaram: 30 min em repouso + 30 min a 60 °C
  ("pré-aquecimento") antes da pós-cura.

---

## 5. Acabamento superficial (a cabeça tem de sair lisa)

- **Mesma geometria em 4 tecnologias (Bazan 2025, Sa em µm):**
  - mSLA: **6,7–8,5**
  - PolyJet: 11,7
  - FFF (PLA = PETG): 12,4 no plano, **até 20–27 em superfícies inclinadas a 15–30°**
  - **SLS PA2200: 27,9**
  - Numa cavidade esférica aparecem todas as inclinações, então o FFF vai ter degraus visíveis
    na calota.
- **Alvo de referência:** espaçadores comerciais são fabricados com "Ra máximo de 1,5–2" na
  superfície articular (Chang 2020; a unidade µm está implícita). **Nenhuma tecnologia chega a
  isso sem pós-processo.**
- **O cimento copia a superfície do molde.** Chang 2020 atribuiu a superfície áspera do próprio
  espaçador ao molde de silicone macio, que deforma durante a cura.
- **Implicações:**
  - SLA dá a melhor cabeça direto do molde.
  - PA12 exige alisamento. Opções de mercado como vapor ou polimento químico **NÃO VERIFICADO**
    quanto a biocompatibilidade após o tratamento. A alternativa é polir a cabeça de cimento
    depois de desmoldar (lima fina, como em Klosterman). O HP HR PA 12 é validado só com
    jateamento + IPA 30 min + água deionizada.
  - FDM: camada ≤ 0,1 mm, altura de camada variável e orientação que evite 15–30° na zona
    articular. Mesmo assim, prever polimento da cabeça.

---

## 6. Porosidade, carga microbiana e uso único × reúso

- **FDM:** mesmo a 100 % de preenchimento há vazios entre filamentos. Jackson 2024 (preprint,
  PMC10996589) viu bactérias "nos sulcos" do PLA. A desinfecção foi variável, as populações
  voltaram horas depois, e os autores recomendam **tratar PLA como uso único**.
- **O calor da impressão reduz a carga microbiana,** mas não é esterilização validada:
  - Neijhoft 2023: nenhuma contaminação com bico mais quente e impressão mais lenta.
  - Riggenbach 2026: 5/30 (16,6 %) contaminados após imprimir PC inoculado.
- **VH2O2 depende de o gás alcançar a superfície.** Shea 2020 alerta para "espaços luminais de
  difusão restrita" em peças impressas.
  - Implicação: **molde sem canais fechados nem cavidades internas.** Respiro e canal de
    injeção abertos e curtos, sólido por dentro.
- **SLS/MJF:** a superfície porosa absorve óleo desmoldante, cimento e sangue (NÃO VERIFICADO
  quantitativamente). Reprocessar exigiria validar limpeza → **uso único**.
- **Reúso só faz sentido com metal** (Kohl 2009: alumínio AA7075 com revestimento cerâmico-teflon
  de 50 µm, reesterilizável), **PEEK/ULTEM** ou **silicone** (Ganji 2024 e Nguyen 2023 reutilizaram).
- **No Brasil:** reprocessar produto de uso único tem regras próprias (RE 2605/2006, RDC 156/2006
  — **NÃO VERIFICADO**, não consegui abrir os textos). Para impressos, **declarar uso único por
  paciente** é o caminho mais simples.

---

## 7. Limpeza, secagem e embalagem (protocolo proposto para o CC)

Protocolo proposto a partir das fontes; validar com a CME do hospital.

1. **Pós-processo do fabricante do material**, sem atalhos. A biocompatibilidade só vale assim:
   - Formlabs: tanque e plataforma **dedicados**, lavagem em IPA e pós-cura conforme IFU (guia
     BioMed Clear); secagem completa antes da pós-cura (Beitler).
   - HP PA12: jateamento, 30 min em IPA, enxágue com água deionizada.
2. **Limpeza:** 30 min de imersão em detergente enzimático → enxágue → 15 min em desinfetante →
   enxágue → secagem (protocolo de Popescu 2025).
3. **Identificação:** gravar no molde as iniciais/ID do paciente, o lado e "ANT/POST", fora da
   cavidade (Shea 2020 gravou iniciais).
4. **Embalagem:** as duas metades, os parafusos e pinos em uma única embalagem. Grau de papel
   para vapor e **Tyvek (sem celulose) para VH2O2** (NÃO VERIFICADO nas fontes lidas; é a regra
   conhecida do STERRAD, confirmar na IFU do esterilizador da CME).
5. **Esterilização por material:**
   - PA12: vapor 134 °C ou 121 °C, ou VH2O2. Secar bem, porque o PA é higroscópico.
   - BioMed Amber: **vapor 121 °C/30 min** (preferido) ou 134 °C/20 min; EtO; gama.
   - PETG/PLA/ABS: **só VH2O2 ou EtO.**
   - Silicone: vapor ou EtO.
6. **O desmoldante entra no campo, não antes da esterilização:** vaselina/bacitracina estéril,
   óleo mineral estéril ou parafina estéril. Oleosos são mais eficazes que aquosos. Perguntar
   sobre alergia à bacitracina.

---

## 8. Classificação biológica: o molde "toca o paciente"?

- **O molde não toca tecido,** mas o que ele molda (o cimento) fica implantado por semanas a meses.
- Um grupo usou resina não médica com o argumento de que "o molde não entra em contato direto
  com o paciente" e esterilizou por plasma (Alaseem 2025). **É o argumento mais fraco**: resíduo
  de resina ou de monômero pode migrar para o cimento.
- **Postura recomendada:** exigir do material do molde pelo menos o conjunto **ISO 10993-5
  (citotoxicidade), -10 (sensibilização/irritação) e -11 (toxicidade sistêmica)**, ou USP classe
  VI. BioMed Amber, HP PA12 e EOS PA 2200 atendem.
- **Os laudos de biocompatibilidade valem para material + processo + pós-processo do fabricante.**
  "FDA/food-safe" em filamento refere-se à resina bruta, não à peça impressa (a própria
  declaração HP e o datasheet PC-ISO dizem isso).
- **Regulatório Brasil:** a RDC 305/2019 define "dispositivo médico sob medida" (fabricado para
  um paciente, sob prescrição) com anuência e notificação por fabricação e BPF conforme a classe
  (resumo Conass). Se o molde impresso no hospital cai nessa categoria (ele é acessório de
  fabricação, não implante) está **NÃO VERIFICADO**. Levar ao jurídico/regulatório antes de uso
  clínico.

---

## 9. O que se compra no Brasil

Os itens marcados com † vieram de resultado de busca; não abri a página do produto.

| Opção | Onde | Observação |
|---|---|---|
| Formlabs BioMed Amber 1 L | 3D Criar (loja.3dcriar.com.br): **R$ 3.355, sem estoque em 25/set/2026** | exige Form 3B/4B e tanque dedicado |
| Formlabs BioMed Clear | 3D Criar† | — |
| PA12 SLS sob demanda | Voxel Manufatura† (SLS PA12/PA11) | pedir o **nome do pó e o laudo** (PA 2200 / HP HR PA12) e o pós-processo usado |
| HP Multi Jet Fusion (revenda) | SKA†; 3DCriar faz terceirização† | idem |
| PEEK (filamento) | UP3D (Intamsys PEEK)†; Voxel (3DXTech ThermaX PEEK/PEI/PPSU)† | **grau médico (Evonik i4 3DF) no Brasil: NÃO VERIFICADO** |
| Impressora PEEK | Materializa (Creatbot PEEK-300, "PEEK de grau médico")† | — |
| PETG "Medical" (Lattice Services, França, ISO 10993-5 do granulado) | filament2print (Espanha, página em PT)† | **envio ao Brasil: NÃO VERIFICADO** |
| ABS Smartfil Medical (Smart Materials 3D; USP VI / ISO 10993-1 declarado) | impresoras3d.com (página em PT)† | **envio ao Brasil: NÃO VERIFICADO** |
| PETG/PLA comuns | Mercado Livre, Brasfila, Universo 3D, F3D† | sem certificação: **só para protótipo** |

---

## 10. Implicações para o gerador (desenho do molde)

1. **Um perfil de material na interface** (PA12 / SLA biomédica / FDM protótipo) que muda
   parede mínima, saída, folga dos pinos e o aviso de esterilização. Valores iniciais
   (NÃO VERIFICADO):
   - FDM: parede ≥ 6–8 mm, 100 % de preenchimento.
   - SLA: parede ≥ 4–5 mm, sólido.
   - PA12: parede ≥ 3–4 mm.
2. **Partição anterior/posterior pelo plano que contém o eixo do colo e o centro da esfera**, para
   que cada metade da cabeça seja no máximo uma semiesfera. **Zero retenção** e saída no corpo
   metafisário. Fendas de alavanca na junta.
3. **Canal de injeção + respiro no ponto mais alto,** abertos e curtos: sem lúmen fechado (VH2O2)
   e com saída para excesso e ar (Kohl).
4. **Cilindros de registro macho/fêmea** com folga ajustável por material. Sugestão: 0,2 mm em
   SLA/MJF e 0,3–0,4 mm em FDM (NÃO VERIFICADO).
5. **Exportar também o "positivo" do espaçador** (STL da peça). Ele serve para (a) vazar um molde
   de silicone autoclavável e (b) prova de tamanho.
6. **Texto fixo no STL** (lado, Ø cabeça, ANT/POST, ID do caso) em relevo raso fora da cavidade.
7. **Aviso na página:** "molde de uso único; material e esterilização conforme tabela; desmoldante
   oleoso estéril; medir o exotérmico no primeiro protótipo".

---

## 11. Perguntas abertas / testes de bancada sugeridos

- **Termopar na interface molde-cimento e no centro da cabeça** (Ø 48–56 mm), com Palacos e
  Simplex. Pergunta: a BioMed Amber flui sob o aperto?
- **Cupom de cada material com cimento:** o MMA ataca PETG, PC ou PA12? O cimento gruda no PA12
  poroso sem desmoldante?
- **Rugosidade da cabeça de cimento** (perfilômetro ou réplica) por tecnologia de molde, antes e
  depois de polir, contra o alvo Ra ≤ 2 µm.
- Alisar PA12 (vapor/químico): mantém biocompatibilidade? (NÃO VERIFICADO)
- A CME do hospital aceita a peça? Tem ciclo validado para ela? (STERRAD NX/100NX, V-PRO,
  autoclave 121/134)
- Enquadramento ANVISA do molde feito no hospital (RDC 305/2019?) e regra de reúso.
- **O molde metálico de Klosterman 2021** (Wright/Stryker "Aequalis Ascend Flex Convertible
  Shoulder System Molds"): material, reúso e esterilização **não descritos** no artigo.

---

## 12. Fontes (lidas)

1. Formlabs — BioMed Amber TDS (HDT, esterilização, ISO 10993): https://formlabs-media.formlabs.com/datasheets/2001403-TDS-ENUS-0.pdf
2. Formlabs — BioMed Amber Sterilization Results (5×132 °C, EtO, gama, e-beam; Δ < 100 µm): https://asset.dynamism.com/media/catalog/product/pdf/Formlabs_BioMed_Amber_Sterilization_Results.pdf
3. Formlabs — guia de resinas biocompatíveis (HDT e esterilização por resina): https://formlabs.com/global/white-papers/formlabs-biocompatible-resins-a-comprehensive-guide-to-choosing/
4. Formlabs — Using BioMed Clear Resin (pós-processo, equipamento dedicado): https://formlabs.com/support/Using-BioMed-Clear-Resin/
5. Sîrbu et al., Dent J 2026 — Surgical Guide resin 121 × 134 °C: https://pmc.ncbi.nlm.nih.gov/articles/PMC13115480/
6. Valls-Esteve et al., Int J Bioprint 2023;9(5):756 — 11 materiais × AU121/AU134/HPO: https://pmc.ncbi.nlm.nih.gov/articles/PMC10406103/
7. Popescu et al., 3D Print Med 2025 — 10 materiais MEX, autoclave × VH2O2: https://pmc.ncbi.nlm.nih.gov/articles/PMC12317548/
8. Pérez-Davila et al., Polymers 2022;14:4117 — PLA × 5 métodos: https://pmc.ncbi.nlm.nih.gov/articles/PMC9572917/
9. Fuentes et al., Polymers 2025 — PLA, PLA-FC, PETG × H2O2 e EtO: https://pmc.ncbi.nlm.nih.gov/articles/PMC12609453/
10. Fuentes et al., Polymers 2022 — PLA, PETG-CF, CPE × calor úmido e seco: https://pmc.ncbi.nlm.nih.gov/articles/PMC8912381/
11. Oth et al., Open Dent J 2019 — PLA/PETG em Sterrad, < 0,2 mm: https://opendentistryjournal.com/VOLUME/13/PAGE/410/ABSTRACT/
12. Toro et al., 3D Print Med 2021 — ABS médico em V-PRO: https://pmc.ncbi.nlm.nih.gov/articles/PMC8439001/
13. Neijhoft et al., Polymers 2023 — PLA: autoclave por diâmetro e esterilidade inerente: https://pmc.ncbi.nlm.nih.gov/articles/PMC9866509/
14. Chiscop et al., J Funct Biomater 2025 — PLA recozido autoclavável: https://pmc.ncbi.nlm.nih.gov/articles/PMC12471281/
15. Sharma et al., J Clin Med 2023 — PEEK i4 3DF, 134–137 °C: https://pmc.ncbi.nlm.nih.gov/articles/PMC10094830/
16. Evonik — VESTAKEEP i4 3DF (ASTM F2026): https://www.evonik.com/content/evonik/de/en/markets/market_1345345/vestakeep-peek-for-medical-devices/3d-printing.html
17. HP — declaração de biocompatibilidade do HR PA 12: https://proto3000.com/wp-content/uploads/2020/05/Proto3000_HP-PA12-Biocompatability-Statement.pdf
18. HP — datasheet do HR PA 12 (HDT, fusão): https://www.fdmdigitalsolutions.co.uk/wp-content/uploads/2024/10/HP-3D-High-Reusability-PA12.pdf
19. EOS — PA 2200 Regulatory Information v2.0 (USP VI, ISO 10993): https://www.3d-activation.de/wp-content/uploads/2019/10/Regulatory_Information_PA_2200_ver_2.0.pdf
20. EOS — datasheet do PA 2200 (fusão 176 °C, Vicat 163 °C): https://www.utwente.nl/en/rpl/Data%20sheets/Formiga%20P110/pa2200-preformance-1.0.pdf
21. Stratasys — datasheet do PC-ISO: https://www.stratasys.com/siteassets/materials/materials-catalog/fdm-materials/pc-iso/mds_fdm_pciso_0820a.pdf
22. Stratasys Direct — biocompatibilidade e esterilização por material: https://www.stratasys.com/en/stratasysdirect/resources/articles/biocompatibility-sterilization-3d-printed-medical-devices/
23. Stratasys — ULTEM 1010 (grau certificado): https://support.stratasys.com/en/Materials/FDM/ULTEM%E2%84%A2-1010-resin
24. Carli et al., J Arthroplasty 2018;33:1930 — temperatura do PMMA em moldes de espaçador (PMID 29610009): https://doi.org/10.1016/j.arth.2018.01.034
25. Beitler et al., 3D Print Med 2022 — desmoldantes em molde BioMed Amber: https://pmc.ncbi.nlm.nih.gov/articles/PMC9373469/
26. Pöppe et al., Acta Neurochir 2022 — "springform", Surgical Guide autoclavado + Palacos: https://pmc.ncbi.nlm.nih.gov/articles/PMC8913485/
27. Formlabs — revisão de moldes de PMMA (Tel 2020/2021, Morales-Gómez 2019…): https://formlabs.com/eu/blog/roundup-pmma-molds/
28. Nguyen et al., SICOT-J 2023 — molde de silicone odontológico em EtO; resina DLP quebrou: https://pmc.ncbi.nlm.nih.gov/articles/PMC10644890/
29. Kong et al., BioMed Res Int 2021 — master de náilon FDM → silicone autoclavado 140 °C/60 min: https://pmc.ncbi.nlm.nih.gov/articles/PMC7884112/
30. Ganji et al., Arch Bone Jt Surg 2024 — silicone prensado autoclavável e reutilizado: https://pmc.ncbi.nlm.nih.gov/articles/PMC11756536
31. Kohl et al., Acta Orthop 2009 — molde de alumínio com revestimento cerâmico-teflon: https://pmc.ncbi.nlm.nih.gov/articles/PMC2823218/
32. Zheng et al., Orthop Surg 2023 — molde de náilon + titânio, óleo de parafina: https://pmc.ncbi.nlm.nih.gov/articles/PMC10549869/
33. Alaseem et al., Curr Oncol 2025 — molde de resina não médica, plasma: https://pmc.ncbi.nlm.nih.gov/articles/PMC12384866/
34. Klosterman et al., Arthrosc Tech 2021 — técnica de referência, óleo mineral: https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/
35. Chang et al., Polymers 2020 — Ra ≤ 1,5–2 em espaçadores; silicone macio → superfície áspera: https://pmc.ncbi.nlm.nih.gov/articles/PMC7601983/
36. Boote et al., Proc IMechE H 2020 — retração do PMMA: https://pmc.ncbi.nlm.nih.gov/articles/PMC7841715
37. Bazan et al., Materials 2025 — Sa por tecnologia e orientação: https://pmc.ncbi.nlm.nih.gov/articles/PMC12735238/
38. Shea et al., 3D Print Med 2020 — 114 pacientes, VH2O2, 7 % de ISC: https://pmc.ncbi.nlm.nih.gov/articles/PMC7106677/
39. Jackson et al., bioRxiv 2024 — contaminação de PLA impresso: https://pmc.ncbi.nlm.nih.gov/articles/PMC10996589/
40. Riggenbach et al., Am J Surg 2026 — FDM reduz carga microbiana (PMID 42470928): https://doi.org/10.1016/j.amjsurg.2026.117142
41. Cranioplastia com master de PLA → silicone (Tg do PLA 55 °C): https://pmc.ncbi.nlm.nih.gov/articles/PMC9473838/
42. Charasseangpaisarn et al., Eur J Dent 2022 — Tg do PLA FDM de 52,6 °C: https://pmc.ncbi.nlm.nih.gov/articles/PMC9949932/
43. Covestro — Makrolon: resistência química (stress cracking): https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/makrolon---the-chemical-resistance.pdf
44. GTeek — compatibilidade do MMA (confiabilidade baixa): https://www.gteek.com/en/chemical-en?chem=methyl-methacrylate-865-1
45. Conass Informa 138 — resumo da RDC Anvisa 305/2019: https://www.conass.org.br/conass-informa-n-138-publicada-a-rdc-anvisa-n-305-que-dispoe-sobre-requisitos-para-fabricacao-comercializacao-importacao-e-exposicao-ao-uso-de-dispositivos-medicos-personalizados/
46. 3D Criar — BioMed Amber (preço em R$): https://loja.3dcriar.com.br/produtos/formlabs-biomed-amber-resina-para-impressora-3d-1-l/
47. Lattice Services — Medical PETG: https://lattice-services.com/en/product/medical-grade-polymer-filament-petg/

Fontes vistas só no resultado de busca, sem abrir a página: Voxel Manufatura (SLS e guia de
filamentos de alta temperatura), UP3D (PEEK), Materializa (Creatbot PEEK-300), SKA (HP),
filament2print e impresoras3d.com. A exigência da ISO 5833 (≤ 90 °C) também veio de resultado de
busca; a norma não foi lida.
