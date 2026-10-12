# Avaliação Fable — molde impresso para espaçador umeral de cimento

Data: 26/set/2026 · Revisor: Fable 5.1 (síntese dos três avaliadores em `_fable_avaliadores.json`,
com cada problema "alta" re-medido por mim em `spacer/out/*.stl` com trimesh e no código atual).
Escopo: pesquisa paralela, não é o SchulterPlan. Decisões clínicas são do Dr. Bruno.

Donos: **molde** = sessão OpenCode (`spacer/lib`, `spacer/moldapp`) · **positivo** = sessão Claude
(`positivo`) · **pesquisa/spec** = notas `research/`, `SPACER_SPEC.md` (Mac) e
`RESEARCH/OPTIONS/SPEC/PLAN.md` (nuvem, `origin/espacador`).

---

## 1. Veredito geral

1. A pesquisa é a parte mais forte do projeto: ampla, com fonte primária, honesta nos "NÃO VERIFICADO". Os 15 números que o avaliador clínico conferiu batem; eu conferi mais 5 (SYNICEM 40/48 × 120 mm, StageOne 1/2 misturas, Tecres 46×22/41×16, 180 dias, ~40° de retroversão) e batem.
2. A infraestrutura do molde está certa (manifold-3d sem three, 36 STLs estanques, ~100 ms por geração, STL binário exato), mas a **geometria v1 não funciona como molde**: 7 defeitos "alta", todos reais, todos re-medidos por mim.
3. O maior deles é de conceito, não de código: a cabeça virou **esfera completa** e o colo um colar Ø17 — contra a decisão travada (prótese anatômica, calota no plano de corte) e contra todos os 9 produtos comerciais.
4. O positivo (Claude) ainda é só um placeholder (`_example`); os modelos A/B/C não existem. Como B e C já nascem com calota + corpo metafisário, eles resolvem o problema de conceito — desde que a altura da calota fique dentro do normativo.
5. Hoje **nada deve ir para bancada com cimento** nem para o campo. São correções pequenas e bem localizadas; a ordem certa é: cirurgião decide a forma (calota + corpo) olhando os positivos, depois o OpenCode corrige o molde uma mudança por vez.

---

## 2. O que está bom

- **Pesquisa (notas 01–08)**: Klosterman lido inteiro com vídeo; erro "3 mm = 1 Fr" do artigo detectado (o código `frToMm = fr/3` está certo); nota 04 já tinha as decisões clínicas corretas (calota anatômica, offset medial 3,9–8,6 mm, corpo não circular, canal 2,4–3,2 mm, 57 g/sachê); notas 03 e 05 são o melhor material sobre exotermia × material impresso e esterilização; nota 06 é realista sobre RDC 925/2024 e RDC 15/2012.
- **Lib do molde**: ESM puro, `manifold-3d` como peer, mesma `init()` em node e browser; `edgeCheck`/`ensureOutward`/`weldSoup` corretos; matriz assada nos vértices (regra da casa); pinos tronco-cônicos com folga medida certa (5,80/4,10 mm); parede 5 mm real fora dos canais; CLI escreve `meta.json` reproduzível.
- **Ideias que devem ficar**: partição sagital y=0 sem contrassaída por construção; registro do tubo torácico como furo coaxial no molde (errata 1); padrão de pinos assimétrico; 1 µm de sobreposição na partição; STL de preview do espaçador que já serve de prova de tamanho.
- **Envelope paramétrico** (cabeça 40–58, haste 8–14, NSA 125–140, L 90–130) cobre todo o mercado.
- **Postura de não-cópia é real**: nenhuma malha comercial no repo; tudo sai de parâmetros.
- **Positivo (base)**: `sphereSegment` com tesselação exata e simétrica em y (desvio ≤ 0,01 mm), validador com componentes, gênero, desmoldagem em Y por ray-cast e espessura mínima — é o validador que faltou na lib do molde.
- **Spike da nota 08 §6** já provou a construção certa (hull de esferas no eixo do colo + `trimByPlane`, 0 faces em contrassaída) e já registrou a lição "gênero −1 = pino solto → exigir 1 componente por metade". A lib v1 repetiu exatamente esse defeito.

---

## 3. Problemas por gravidade e por dono

Cada "alta" foi re-medido por mim (trimesh sobre `spacer/out/spacer_h48_s10_*.stl`, `h44_s8`, `h52_s14`, e leitura do código de 26/set). **Nenhum "alta" caiu.**

### 3.1 MOLDE — dono OpenCode (`lib/`, `moldapp/`)

#### ALTA

**M1 — Núcleo solto dentro de cada metade (o molde não funciona).**
- Onde: `lib/src/spacerSolid.js:38-47` (canal Ø3 + assento Ø6 subtraídos do ESPAÇADOR) → `lib/src/mold.js:117,123` (metade = bloco − espaçador).
- Problema: o canal da haste-guia, subtraído do sólido, vira material POSITIVO do molde: uma meia-cana Ø3 flutuando no ar dentro da cavidade, sem tocar o bloco. Imprime como peça avulsa; a haste-guia não pode ser deitada no cimento (Klosterman) porque a nervura ocupa o lugar; o espaçador curado sai com um furo vazio — a única armadura do construto some.
- Prova (minha): `anterior.stl` bodies = 2 (corpo 1: 0,538 cm³, bbox x[−3,3] y[0,3] z[2,119,6]); `posterior.stl` bodies = 4 (mesmo núcleo em y[−3,0] + 2 pinos soltos, ver M2). Igual em h44_s8 e h52_s14. O preview do espaçador é oco no eixo de z=−0,5 até 119. `test/run.mjs` passa porque só conta openEdges e volume.
- Correção: NÃO subtrair canal nem assento do espaçador. A haste-guia é o inserto: deitada no cimento mole numa metade aberta, bola dentro da cabeça (técnica Klosterman). Se quiser centrar, rebaixo raso de meia-cana SÓ na metade POST, terminando 10 mm antes do topo da haste. Teste novo: componentes == 1 por metade (`split()`), e "preview ∩ (ANT ∪ POST) = ∅".

**M2 — Dois dos três pinos ficam FORA do bloco.**
- Onde: `lib/src/mold.js:38-49` (`pinPositions`: `a = largura/2 − 9`, posições em ±a em torno de x=0).
- Problema: o bloco não é centrado em x=0 (cabeça deslocada: x ∈ [−13,5, 44,7]), mas o padrão usa ±a absoluto. Sobra UM par pino/furo: sem trava de rotação, sem padrão assimétrico — o molde fecha girado.
- Prova (minha): `meta.json` pinPoints [[20,1;1],[−20,1;1],[−20,1;133]] com blockBounds x[−13,5, 44,7]; no `posterior.stl` há dois corpos soltos de 0,199 cm³ em x[−23,1, −17,1] (fora do bloco). Idem h44_s8 (x −21…−15 vs bloco −12,6) e h52_s14 (x −26,5…−20,5 vs −16,9).
- Correção: `xc = (min[0]+max[0])/2; x = xc ± a`. Teste: cada pino ∩ meia-bloco tem volume > 0 e furo ∩ ANT > 0.

**M3 — O único pino funcional tampa o vent da haste.**
- Onde: `lib/src/mold.js:40` (z1 = min+9 = 1), `:106-110` (stemVent em z=3, r=1,25 → z ∈ [1,75, 4,25]), `:119,125` (pinos somados DEPOIS dos canais).
- Problema: pino em (20,1; z=1) com base r=3 ocupa z ∈ [−2, 4] e cruza o vent. Na POST o pino enche a canaleta; na ANT o furo corta. Fechado, o canal está morto.
- Prova (minha): `posterior.stl` `contains(20,1; 0,5; 3)` = SÓLIDO, enquanto (12; 0,5; 3) e (30; 0,5; 3) = vazio (canaleta) — o pino está exatamente no meio do vent.
- Correção: z1 ≥ 12 (ou tirar o vent da faixa dos pinos) + teste de continuidade: marchar pontos ao longo do eixo de cada canal em ANT ∪ POST fechado e exigir vazio em todos.

**M4 — Não existe batente para o tubo torácico; a constraint aceita tubo maior que a haste.**
- Onde: `lib/src/mold.js:90-92` (furo Ø tubeOD+0,3, passante de z=−10 a +2); `lib/src/params.js:90-94,107`.
- Problema: furo Ø9,63 passante e cavidade da haste Ø10 > OD 9,33 do tubo — o tubo desliza para dentro da cavidade sem parar. A "errata 1" descreve um encosto que não existe. E `resolveParams` só recusa tubo > haste+1,2 mm (haste 10 com 31 Fr = OD 10,33 passa), o que é impossível: o tubo tem de caber no canal fresado.
- Prova (minha): corte z=−4 da ANT: raio mínimo 4,811 (furo) vs raio da haste 5,0; `posterior` vazio em (0; −0,5; −4) e (0; −0,5; 1) — furo direto até a cavidade.
- Correção: rebaixo (counterbore) Ø(OD+0,3) com piso de 2 mm e furo Ø3,2 para a haste-guia (reproduz o cone do molde Wright) OU espigão: os 10 mm distais da cavidade com Ø = OD+0,3 e degrau para Ø da haste (junção monolítica). Constraint: `tubeOD > stemD → erro`. Ver Decisão 4 e passo 7.

**M5 — Porta de injeção no polo ARTICULAR da cabeça; saídas rasgam os cantos do bloco.**
- Onde: `lib/src/mold.js:95-105` (porta ao longo de `neckDir` a partir de R−2; vents ⊥ neckDir); `SPACER_SPEC.md:102-104`.
- Problema: a porta Ø10 entra pelo ponto de maior contato com a glenoide. "Região sacrificial" não existe aí: o toco cortado com lâmina fica onde a erosão glenoidal já é a complicação mais frequente (83 % Beady, 36 % Da Silva). Broughton e as patentes Biomet põem a porta em área NÃO articular; SYNICEM vende "perfectly spherical and polished" por isso; Klosterman nem injeta — enche a céu aberto. Os canais ainda saem pelos cantos superiores com parede < 1 mm.
- Prova (minha): ANT vazia ao longo do eixo do colo a +1, +3, +6, +9 e +20 mm do polo (furo passante no polo); vazia em (44; 0,5; 136,6) e (−13,2; 0,5; 141,5) — saídas cortando os cantos.
- Correção: `portEnabled = false` por padrão (técnica primária = encher as duas metades a céu aberto, já documentada em SPACER_SPEC §4.3). Se houver porta: pela face distal (piso do furo do tubo) ou no calcar, saindo perpendicular a uma face com ≥ 5 mm de parede; vents no ponto mais alto da cavidade na orientação de enchimento, nunca no arco articular. Teste de espessura mínima por raio bloqueando a exportação. Ver Decisão 3.

**M6 — Cabeça = esfera completa (contra a decisão travada e contra todo o mercado).**
- Onde: `lib/src/spacerSolid.js:6-11,29`; `lib/src/params.js:63-66` (`headT` calculado e ignorado); `SPACER_SPEC.md:46-50` (errata 5).
- Problema: nenhum dos 9 produtos usa esfera completa; todos usam calota (h/D 0,37–0,63) com face plana que assenta no corte. Sem face plana não há referência de altura nem de rotação; o polo inferior da esfera invade a metáfise onde estão as tuberosidades; ou se cava o osso ou a cabeça fica ~12–17 mm alta (Nyffeler: +10 mm → −16° de abdução); o cimento dobra (64 cm³ vs ~30–45). A justificativa da errata ("a calota inclinada desconecta do colo") é limitação de implementação: o colar é um cilindro em Z, não segue o eixo do colo.
- Prova (minha): esfera centro (15,7; 0; 110), R 24 → ponto mais baixo z=86,0; topo da haste z=95,6 (9,6 mm ACIMA do polo da esfera); seção em z=96 já tem 44 mm de largura em x. Volume 64,1 cm³ (H48S10), 87,2 (H52S14).
- Correção: cabeça = esfera ∩ meio-espaço ⊥ eixo do colo a (T−R) do centro, T ≈ 0,40–0,45·D; colo = hull/frustum ao longo do eixo do colo até a base da calota (receita da nota 08 §6). Na prática: **adotar o positivo B ou C** (Claude) como `spacerSolid`. Ver Decisão 1.

**M7 — Não existe corpo metafisário: transição cabeça→haste é um colar cilíndrico Ø17.**
- Onde: `lib/src/params.js:104` (`collarD = clamp(1,7·haste, haste+6, 0,62·D)` = 17 para H48), `lib/src/spacerSolid.js:32-34`.
- Problema: todos os comerciais têm corpo largo (SYNICEM 34–40 mm frontal, REMEDY 15,8×14 ML×AP, Wright "calcar medial curvo, ombro lateral") que preenche a metáfise e dá antirrotação sem aletas. Rotação é a falha mecânica mais citada (McFarland 3/50, Aibinder 3/27; IFU Tecres/REMEDY obrigam cimento proximal por isso). Um cilindro liso Ø10 num canal fresado de 10 não tem controle rotacional nenhum; e o degrau Ø10→Ø17 é concentrador de tensão.
- Prova (minha): seções do preview: z=50 → Ø10; z=96 → colar começa sem transição. Código confirma `collarH = 12`, cilindro reto.
- Correção: corpo oval ML > AP (≈ 0,75–0,85·D de largura na base, razão ML/AP ≈ 1,1–1,2), calcar medial curvo, loft suave até a haste, liso, sem furos. Fica sem contrassaída em y=0 porque o eixo maior é x. **Resolve-se junto com M6 adotando o positivo B.** Ver Decisão 2.

#### MÉDIA

- **M8 — Estimador de sachês ~2× alto.** `lib/src/index.js:62` (`ceil(cm³/22)`), `README.md:80`. 1 sachê Palacos curado = 57 g (Satish 2018) ≈ 45–48 cm³ a 1,2–1,3 g/cm³ (densidade NÃO VERIFICADA); 22 cm³ implicaria 2,6 g/cm³. Controle: StageOne 431414 (58×24 + haste 14×122) = 2 misturas; a lib manda 4 para H52S14. Correção: uma constante só, ~45 cm³ com margem de perda 20 %, editável, rotulada "estimativa; calibrar pesando a 1ª peça". Vale também para o positivo (P1) e para a spec.
- **M9 — Todos os pinos numa metade.** `mold.js:113-125`. O pedido era 1 macho + 1 fêmea por metade (WORKFLOW_SCRIPT.js, nota 01 §12.2, nota 04 §16.6). Funciona igual, mas não é o pedido e não está registrado como errata. ~10 linhas depois de M2. Registrar como errata 6.
- **M10 — Nenhum meio de fechamento.** `mold.js:62-81`: bloco liso 58×58×150 mm, sem orelhas, furos de parafuso, canal de abraçadeira ou fendas de alavanca; a spec §4.3 fala em "Kocher nas orelhas", e um Kocher não abre 58 mm. Correção: faces externas planas e paralelas (grampo em C, Klosterman) + orelhas de 12 mm com 2–4 furos M5 e porca embutida + 2 fendas de alavanca na partição + sulco de rebarba 1×1 mm a 3 mm da cavidade.
- **M11 — Haste cilíndrica reta com ponta plana.** `spacerSolid.js:30-31`. Todos os pré-formados têm haste cônica (~1°, SYNICEM Ø8,5→11 em 80 mm) e ponta arredondada — facilita inserção e, principalmente, remoção. Correção: `stemTaperDeg` (default ~1°), chanfro/raio na ponta, Ø distal casado com o OD do tubo.
- **M12 — printNotes recomendam PETG para o centro cirúrgico.** `index.js:73-77`, `README.md:102-109`: "PETG… exotermia >60 °C". A própria pesquisa diz: núcleo do PMMA > 100 °C em massa de espaçador (Carli 115 °C, Hoyt 113 °C), PETG HDT 68–80 °C, PETG só bancada; PA12 SLS/MJF ou BioMed Amber para o CC; 100 % de preenchimento (nota 05 §0, §3; nota 03 §2). Correção: perfil de material "bancada" (PETG 100 %) × "clínico" (PA12), e termopar na primeira bancada.
- **M13 — `moldapp` não é o produto pedido e tem um segundo motor divergente.** `moldapp/index.html:19-75`, `js/app.js:77-83`, `js/moldEngine.js`. Carrega qualquer STL, não tem sliders de cabeça/haste/Fr, não exporta o espaçador nem mostra sachês; `moldEngine.js` não tem furo do tubo nem vents de domínio, e o sprue genérico passa pelo centro do bbox = centro da esfera (`:144-148`). Correção: página = casca fina sobre `generateSpacerMold` (presets, sliders, explodida, 3 downloads + JSON). Não manter dois motores.
- **M14 — `moldEngine.js` corta sempre na coordenada 0 e a busca 50/50 tem três erros.** `:32-36` e `:163-164` (halfspace fixo em ±150 sem `planeAt`); `:92` (sonda começa em at/2); `:99` (`total = sideVol(hi)` = volume acima do bbox = 0); `:102` (bisseção anda para o lado errado). Sem checagem de contrassaída. Prova (minha): `out/spacerMold_A.stl` tem 2 corpos (núcleo solto de M1) e a esfera inteira (z 19–67) dentro da metade A (z 0–73) — cavidade fechada, impossível desmoldar, e a página diz "manifold OK". Correção: `halfspace(axis, sign, planeAt)`; sonda em `at + 150`; `total = sideVol(lo)`; inverter a bisseção; recusar exportação se alguma face da cavidade tiver n·d < −ε.
- **M15 — Os testes não medem o que quebrou.** `lib/test/run.mjs` (29 verdes com 7 defeitos fatais): não conta componentes, não testa continuidade de canal, não verifica pino dentro do bloco, não faz o espelho AP da spec §6.6. `moldapp/test/moldapp_test.mjs:17-18` lê `spacer/out/…preview.stl`, que é gitignored (`.gitignore:114` — conferido) → falha em checkout limpo. Correção: gerar a fixture no teste; adicionar componentes == 1, pino ∩ meia-bloco > 0, marcha de canais, espelho y→−y, espessura mínima por raio. Sugestão: promover o script trimesh dos avaliadores a `tools/spacer_verify.py` como controle EXTERNO ("fixture escrito por quem escreveu o módulo esconde o defeito").
- **M16 — README do moldapp manda servir da pasta errada.** `moldapp/README.md:11` (`http.server -d spacer/moldapp`) × `js/app.js:3` e `moldEngine.js:17-21` (`../../lib/src/…`): servido assim, `/lib/src/index.js` dá 404. O HANDOFF_MOLD_SYSTEM já sabe (servir de `spacer/`); corrigir o README.

#### BAIXA

- Bloco = bounding box maciço: ~220 cm³ de plástico por metade (H48), 261 (H52) para uma cavidade de 64 cm³. Casca por offset de 8–10 mm + orelhas, ou documentar infill 15–20 % com 5 perímetros.
- Nenhum `.delete()` nos objetos WASM (`grep` só acha um comentário em `builders.js:246`): heap cresce a cada regeneração no browser (lição da nota 08 §2.5).
- `stl.js:14-15`: travessão U+2014 no header vira byte 0x14; `io.js:7-10` trata como ASCII qualquer STL cujo header comece com "solid" (SolidWorks/Meshmixer binários viram malha vazia). Detectar binário por `84 + 50·n === byteLength`.
- `scripts/render_preview.mjs` gera PNGs quase pretos (`out/mold_*.png`); cortes de seção via trimesh mostram tudo.
- Sem orientação de impressão (face de partição para cima, cavidade vira bacia sem suporte) e sem rótulos ANT/POST/tamanho em relevo.
- `params.js:18` repete "3 mm = 1 Fr" no comentário (código certo: `fr/3`).

### 3.2 POSITIVO — dono Claude (`positivo/`)

Estado em 26/set: só o placeholder `_example` (3 tamanhos, validação OK). Modelos A/B/C ainda não existem; `positivo/test/foundation_test.mjs`, que o handoff manda conferir, **não existe**. Não há "alta" porque não há modelo ainda — os pontos abaixo são para os modelos nascerem certos.

#### MÉDIA

- **P1 — Terceira constante de cimento, diferente das outras duas.** `positivo/src/validate.mjs:19-20,361-362`: densidade 1,18 g/cm³ e "1 sachê = 40 g de cimento" → 34 cm³/sachê. A lib diz 22 cm³, a SPEC da nuvem diz 44, a nota 04 diz ~45–48 (57 g curado/sachê). Correção: UMA constante compartilhada (cm³ por sachê ≈ 45–48, rotulada "não verificada, calibrar na bancada") nos três lugares.
- **P2 — Altura da calota sem teto normativo.** `WORKFLOW_POSITIVOS.js` pede para B "near-hemispherical or slightly larger" (h/D > 0,5) e para C h ≈ 0,45·D; o `_example` usa `cutFrac −0,3` (h/D 0,65). O normativo é h/R 0,64–0,77 (Hertel) → h/D 0,32–0,39; Iannotti 19/48 = 0,40; mercado 0,37–0,63. Overstuffing é altura, não diâmetro (Nyffeler +5 mm → −10°; Blevins; Matsen). Correção: expor Ø e T como parâmetros independentes (default T ≈ 0,40·D, faixa 0,36–0,48), mostrar diâmetro da base e alertar se base > 50 mm (elipse do corte, Hertel) ou T > 19 mm. "Cabeça maior" = +2–4 mm de Ø com T anatômico.
- **P3 — O contrato positivo → moldapp perde o registro do tubo e a alma.** `positivo/src/models/_example.mjs:45` (ponta = cápsula arredondada em z=0); `moldEngine.js` genérico não tem furo do tubo, batente nem canal da haste-guia; o `HANDOFF_2026-09-25` diz que o positivo vai ser carregado no moldapp. Resultado: o molde feito do positivo não recebe o tubo torácico. Correção: no JSON `meta` de cada modelo declarar `distalFace` (Ø e z da face plana ou do espigão), `tubeSeat` sugerido e `corePolyline` (B já prevê); o gerador do molde (não o moldapp genérico) lê isso. Fechar esse contrato com o OpenCode ANTES de desenhar A/B/C.
- **P4 — Furos de sutura ligados por padrão em B e C** (`sutureHoles default 3` no brief) contra a regra travada "sem furos, sem aletas finas". Correção: default 0; deixar como opção até a Decisão 5. Furos passantes em Y são compatíveis com o molde (cada metade recebe meio pino preso à parede da cavidade).

#### BAIXA

- NSA default 135 (`common.mjs`, `_example.mjs`) × 132,5 na lib. Alinhar num só valor (a SPEC da nuvem e a nota 04 pedem 135).
- O validador mede espessura e desmoldagem, mas não checa intenção clínica: nenhum ponto da cabeça abaixo do plano de corte, topo da haste ≤ plano de corte, offset medial dentro de 3,9–8,6 mm, base da calota ≤ elipse do corte. São 4 asserts baratos sobre `meta`.

### 3.3 PESQUISA / SPEC

#### ALTA

**S1 — Três especificações concorrentes com DOIS sistemas de eixos incompatíveis.**
- Onde: `SPEC.md` da nuvem §2 (`origin/espacador`): +Y proximal, +X medial, +Z anterior, partição z=0. `SPACER_SPEC.md` (Mac), `lib/src/params.js:3-8` e `positivo/src/common.mjs:3-7`: haste +Z, partição y=0. Além disso a `SPEC.md` da nuvem diz "substitui o rascunho SPACER_SPEC.md", enquanto a lib e o positivo seguem o rascunho.
- Problema: quem implementar a etapa 1 do `PLAN.md` da nuvem vai escrever código num frame diferente do que a lib e o positivo já usam. A `SPACER_SPEC.md` local ainda cita como base só `RESEARCH_SHOULDER_SPACERS.md` (que o `CLOUD_HANDOFF.md:10` manda conferir), ignora a nota 04 (calota anatômica, offset 3,9–8,6, corpo não circular) e por isso a v1 saiu esfera completa com colar.
- Prova: leitura direta dos três arquivos (linhas acima); `README.md` da nuvem:22 marca `SPACER_SPEC.md` e `lib/` como "rascunhos substituídos".
- Correção: decidir o frame UMA vez (recomendo o da lib/positivo: +Z haste, y=0 partição — é o que já tem código e 36 STLs), e reescrever a `SPEC.md` da nuvem nesse frame ao resolver o conflito de `git pull`. Uma spec só, com as erratas dentro.

#### MÉDIA

- **S2 — Offset medial derivado de razão arbitrária.** `params.js:81-88` (`embed = 0,30·D; Cx = embed·tanβ` = 15,7 mm) e `SPACER_SPEC.md:53`. Hertel p10–p90 = 3,9–8,6 mm; Sheth & Hsu: desvio do COR > 3–4 mm piora resultado. Efeito colateral com esfera completa: mexer no NSA só desloca o centro (125° → 20,6 mm; 140° → 12,1 mm), o inverso da intuição. Correção: parâmetros anatômicos explícitos `medialOffset` (default 6, faixa 3–9, alerta fora de p10–p90) e derivar `stemTopZ` do plano de corte. A SPEC da nuvem já faz isso (`headOffset` 6).
- **S3 — Constante de cimento em três valores** (22 / 44 / 34 cm³ por sachê) e receita de antibiótico POR SACHÊ (vanco 2 g + tobra 3,6 g): o número errado infla a dose sugerida. Ver M8/P1. Mostrar gramas totais e o teto 8 g/40 g (Samelis).
- **S4 — Material: spec/README dizem PETG para o CC; a pesquisa diz PA12.** `SPACER_SPEC.md:135-138` × nota 05 §0(b), §3; nota 03 §2.2; nota 06 §2.4 (CME só processa produto regularizado). Ver M12 e Decisão 6.
- **S5 — Alma fixa em 2,5 mm e junção de topo com o tubo.** `params.js:108-110`, `SPACER_SPEC.md:78-81`. Beady 2025 critica a haste em tubo por falta de rigidez (fraturas) e teve 0/18 com Steinmann; Adan usa Rush; nota 04 §8 pedia 2,4–3,2 mm como parâmetro. ID do tubo Argyle não é publicado (só OD): a haste distal de cimento sai com o Ø INTERNO, e a spec não avisa. Ver Decisão 4.
- **S6 — Rastreabilidade.** `SPACER_SPEC.md:16,76` repete "3 mm = 1 Fr" (invertido; correto Ø mm = Fr/3); `:6` afirma "molde metálico" quando a nota 01:261 marca a liga como NÃO VERIFICADA; `:5` cita como base o documento errado. Correção: listar as notas 01–08 como base e apontar, por parâmetro, a linha da nota que o sustenta (a nota 04 §16 já é esse índice).

#### BAIXA

- BIOFIX (Biomedica Italia) não aparece em nenhuma nota; Subiton TEM espaçador de ombro (caixa "HA48" na foto de `referencia/`) mas a nota 02:303-305 conclui que a Víncula "não lista ombro" e que não há registro ANVISA de ombro. Pode estar errado, e muda a justificativa exigida pela RDC 925 art. 11. (Eu NÃO abri as páginas dos fabricantes; o avaliador comercial abriu.)
- `referencia/` tem 6 imagens sem índice; duas são miniaturas de 3–8 KB. Adicionar `referencia/README.md` com origem, produto e o que cada uma ensina.
- "Comprimento": o nosso `stemL` é ponta → centro da cabeça; os catálogos (SYNICEM/BIOFIX "120 mm", StageOne 122, REMEDY 101/116/131) medem ponta → base da cabeça. Nosso H48 L110 tem 134 mm de altura total; o SYNICEM 48H ≈ 130. Publicar os dois comprimentos.
- A SPEC da nuvem recomenda 2 chaves, o rascunho local 3 pinos, o brief "1 macho + 1 fêmea": registrar a escolha (errata 6).

---

## 4. Comparação com os comerciais

Fontes: folhetos/IFU lidos pelo avaliador comercial (SYNICEM US MA0500R1 e EU MA0416R3, IFU Prothys; Tecres IFU OST008; StageOne 5426.1; REMEDY MKT020; K202338; Klosterman PMC7917196). Eu re-conferi nos textos extraídos: SYNICEM 40H/48H × 120 mm (1,0/1,5 g), StageOne 431406 = 1 mistura / 431414 = 2, Tecres 46×22×125 Ø11 / 41×16×99 Ø7, 180 dias, ~40° de retroversão. BIOFIX e Subiton: só páginas web e fotos, sem tabela (dimensões NÃO VERIFICADAS). "n/p" = não publicado.

| Item | **Nosso v1** (H48 S10 L110, medido) | SYNICEM 40H/48H | BIOFIX (Biomedica) | Subiton HA48 | Tecres Spacer-S / InterSpace | StageOne (Zimmer, silicone) | REMEDY (OsteoRemedies) | SpaceFlex / CeMend (2 meias-moldes) | Wright Ascend Flex (molde de Klosterman) |
|---|---|---|---|---|---|---|---|---|---|
| Ø cabeça (mm) | 40–58 passo 1 (presets 44/48/52) | 40, 48 | 2 tamanhos (n/p) | 48 | 41, 46 | 42–58 (5) | 40, 45, 50 | 42, 48 | 43, 48, 52 |
| Altura da calota (h/D) | **esfera completa (1,0)** | 19,1 / 22,9 (0,48) | calota (foto) | calota (foto) | 16 / 22 (0,39 / 0,48) | 18–24 (0,41–0,43) | 25 (0,50–0,63) | offset 15 / 18 | 16/18/23 (0,37–0,44) |
| Face plana de ressecção | **não** | sim | sim | sim | sim | sim | sim | sim | sim |
| NSA | 125–140 (132,5) | ~135 (calque, NÃO VERIFICADO) | n/p | n/p | 130 | n/p | 130 | n/p | ~132,5 (est.) |
| Corpo metafisário | **colar Ø17 × 12** | 34–40 mm frontal, largo | igual SYNICEM | igual | cone curto | corpo "dimpled" | ML×AP 9,4×7,8 → 15,8×14 | n/p | fusiforme, calcar curvo, ombro lateral |
| Haste | Ø8–14 **reta**, ponta plana | ≈8,5 → 11 (leve cone), 120 | 1 comprimento (~120) | cônica longa | Ø7 (L99) / Ø11 (L125), sulco | 6–14 × 122 | 7/10,5/14 × 101/116/131 | 8–14 × 90–170 | tamanhos 2/4/6/8 + tubo 24–34 Fr |
| Alma metálica | canal Ø3 (**hoje impossível de moldar**, M1) | aço 316L cabeça→ponta | "núcleo metálico" | "alma metálica" | 316L | **nenhuma** | 316 ESR só na haste | haste inox + 2 pinos | fio 2,5 mm ponta-bola |
| Furos / aleta de sutura | nenhum (regra) | aleta lateral, 3 furos | aleta, 3 furos | aleta, 3 furos | nenhum | nenhum | nenhum | nenhum | nenhum |
| Acabamento da cabeça | camadas FDM (nada previsto) | "perfectly spherical and polished" | n/p | n/p | liso | liso (covinhas só no corpo) | liso | n/p | polido (molde metálico) |
| Cimento / massa | 48–87 cm³ → lib diz 3–4 sachês | n/p | n/p | n/p | ≈43 g | 1 mistura (42) / 2 (46–58) | ≈29 g | n/p | 2 sachês (corpo + tubo) |
| Provas / gabarito RX | nenhum | prova metálica + calques 1:1,15 | n/p | n/p | trial + template | trials + RX | provas Radel | insertos por tamanho | broach |
| Cimentação proximal | não mencionada | "se necessário, metáfise alta" | n/p | n/p | opcional | press-fit ou leve | obrigatória | n/p | não |
| Máx. in vivo | 180 d (nota) | 6 meses | n/p | n/p | 180 d | 180 d | 180 d | n/p | — |

**O que adotar, sem copiar:**

1. **Calota com base plana e rebordo arredondado** (todos os 9), h/D default ~0,42–0,45, e T separado do Ø. "Maior que a anatômica" = +2–4 mm de Ø, não uma esfera inteira.
2. **Corpo metafisário oval (ML > AP ≈ 1,1–1,2)**, largura na base ≈ 0,75–0,85·D, calcar medial curvo, ombro lateral, liso — antirrotação sem aletas (REMEDY, SYNICEM, molde Wright).
3. **Haste cônica ~1° com ponta arredondada**, famílias S/M/L de Ø distal 8 / 10–11 / 14 casadas com o Fr do tubo (24–34 Fr = 8,0–11,3 mm).
4. **Alma contínua da cabeça à ponta** (SYNICEM desenha a haste dobrada entrando na calota; Wright leva a bola do fio para dentro da cabeça) — deitada no cimento, nunca canal moldado.
5. **Grade discreta de tamanhos** na tela (cabeça × proximal × comprimento, como SpaceFlex 2×4×9, REMEDY 3×3, Wright 3×4); slider fino só no modo avançado.
6. **Dois comprimentos publicados**: L comercial (ponta → base da cabeça) e L centro.
7. **Provas**: STL "trial" da calota + corpo (sem haste) e calque 1:1 / 1:1,15 (padrão SYNICEM) para escolher tamanho antes de moldar.
8. **Acabamento da cavidade da cabeça**: camada 0,08–0,12 mm, lixar/selar, ou inserto de cabeça em resina (CeMend tem "head inserts") — para chegar perto do "polished" que o SYNICEM vende.
9. **Notas de técnica dos IFUs na tela** (nunca como medida): cimentar só a metáfise alta se instável, não impactar com marreta, retroversão ~30–40° na implantação, 180 dias.
10. **Aleta de sutura espessa opcional** (SYNICEM/BIOFIX/Subiton) — ver Decisão 5.
11. **Cimento em "misturas de 40 g"** como o StageOne, com constante ~45–48 cm³ e receita por sachê real.
12. **Casca de molde por offset** em vez de bloco (SpaceFlex/StageOne são cascas): 3–4× menos plástico.

---

## 5. Decisões do cirurgião (6)

Perguntas que os três avaliadores repetiram, consolidadas. Cada uma com duas opções, a recomendação e o porquê. Tudo é decisão sua; o que está abaixo é a leitura da evidência.

**D1 — Forma da cabeça: calota com face plana no colo anatômico, ou esfera completa (v1)?**
- A) **Calota**: esfera cortada ⊥ ao eixo do colo, T ≈ 0,40–0,45·D (16–24 mm como os catálogos), base plana sobre o corpo, rebordo arredondado. "Maior" = Ø +2–4 mm com T anatômico.
- B) Esfera completa (v1): mais lisa, booleano simples, "um pouco maior".
- **Recomendação: A.** É a decisão já travada e o desenho de todos os 9 produtos (inclusive os 4 que o senhor mandou). A esfera não tem assento, invade a metáfise (polo 9,6 mm abaixo do topo da haste) ou sobe a cabeça 12–17 mm (Nyffeler: +10 mm → −16° de abdução), e dobra o cimento. A "impossibilidade" era só o colar em Z; o spike da nota 08 e o positivo já constroem certo.

**D2 — Transição cabeça→haste: corpo metafisário oval largo, ou colar cilíndrico (v1)?**
- A) **Corpo oval** ML > AP (≈ 0,8·D na base, ML/AP ≈ 1,15), calcar medial curvo, ombro lateral, loft suave até a haste, liso.
- B) Colar Ø 1,7× haste (17 mm no H48).
- **Recomendação: A.** Rotação é a falha mecânica mais citada; com tuberosidades presentes o envelope metafisário é o único antirrotação sem aletas; o SYNICEM tem 34–40 mm onde temos 17. O positivo B já é isso.

**D3 — Enchimento: a céu aberto sem porta (Klosterman), ou fechado com porta e vents?**
- A) **Aberto**: encher cada metade, deitar a haste-guia, fechar, grampear; sulco de rebarba e fendas de alavanca; `portEnabled = false`.
- B) Fechado: porta Ø8–12 em área NÃO articular (face distal ou calcar) + vents no ponto mais alto.
- **Recomendação: A.** É a técnica validada em vídeo; elimina de uma vez a porta no polo articular, os canais rasgando os cantos e a dúvida sobre Ø de vent para cimento pastoso (nenhum número publicado). A porta pode voltar numa v2 com o mesmo motor.

**D4 — Alma metálica: fio 2,5 mm ponta-bola em canal moldado (v1), ou alma embutida com bitola parametrizada?**
- A) Canal Ø3 + assento Ø6 moldados (v1) para inserir depois.
- B) **Alma deitada no cimento mole** (sem canal), Ø como parâmetro (2,5 fio / 3,2 Steinmann / 4,0–4,8 Rush), rebaixo raso de centragem só na POST, furo do tubo com batente derivado dela; tubo entra 5–10 mm na cavidade para junção monolítica.
- **Recomendação: B, default 3,2 mm.** A opção A é fisicamente impossível num molde de duas metades (núcleo solto, M1). Beady 2025 critica a haste em tubo por falta de rigidez e teve 0 fraturas em 18 com Steinmann; Lunz: nenhum cimento com vancomicina passa de 50 MPa em 6 semanas; todos os pré-formados têm alma de aço. O 2,5 mm de Klosterman continua disponível.

**D5 — Furos de sutura para manguito/tuberosidade: proibição total (regra atual), ou opção desligada por padrão?**
- A) **Nenhum furo** (decisão travada; nota 04: reparo do subescapular osso-osso com tuberosidade preservada).
- B) Opcional, OFF por padrão: aba lateral espessa (≥ 8 mm) integrada ao corpo, 2–3 furos Ø2,5 ao longo de Y, fora do colo e do arco articular.
- **Recomendação: A como padrão, B como opção desligada.** Nenhum estudo de ombro mostra benefício de furos, e furo no colo é concentrador de tensão. Mas as três referências que o senhor escolheu (SYNICEM, BIOFIX, Subiton) destacam exatamente isso ("three hole fin… temporary reinsertion of the rotator cuff"); como opção não custa nada e evita v2. Os modelos B e C do positivo já preveem; o default deve ser 0 até o senhor decidir.

**D6 — Material do molde e caminho até o primeiro caso: PETG direto, ou PETG na bancada → PA12 no centro cirúrgico com rota regulatória?**
- A) PETG impresso em casa, EtO/H₂O₂, uso único, como ato médico (zona cinzenta: RDC 15 art. 9º).
- B) **PETG 100 % só para bancada** (encaixe, desmoldagem com gesso, depois cimento com termopar, pesar a peça); **PA12 SLS/MJF** (ou BioMed Amber a 121 °C) para o CC; protocolo no CEP e/ou bureau licenciado entregando o molde estéril "sob medida" a partir da sua prescrição (RDC 925 art. 2º III); ficha de prescrição gerada pelo app.
- **Recomendação: B.** O núcleo do PMMA passa de 100 °C em massa de espaçador; PETG tem HDT 68–80 °C e a parede não protege; PA12 é o único material comum que passou nos 3 ciclos de esterilização com Δ < 0,05 mm. Um evento adverso (5–13 % esperados mesmo com pré-formado) com molde caseiro traz responsabilidade objetiva de fabricante. Se o Subiton HA48 ou o BIOFIX tiverem registro ANVISA, a justificativa "por que não o registrado" passa a ser exigida.

Decisões menores que podem esperar e ficam nos passos: 1 macho + 1 fêmea por metade (errata 6); junção tubo↔corpo espigão × rebaixo; grade discreta × slider; qual "comprimento" vai na tela; folga da haste vs fresa (−0,5 mm).

---

## 6. Próximos passos, em ordem (uma mudança, o cirurgião olha, depois a próxima)

| # | Dono | Mudança única | Pronto quando |
|---|---|---|---|
| 0 | pesquisa/spec | Fechar S1: um frame (+Z haste, y=0 partição) e uma spec só; OpenCode commita, `git pull`, resolver `SPACER_SPEC.md` à mão | os três códigos e a spec dizem o mesmo frame |
| 1 | positivo (Claude) | Fechar o contrato positivo ↔ molde (P3): `meta` com `distalFace`, `tubeSeat`, `corePolyline`, `headBasePlane`; NSA 135 nos dois lados | JSON do `_example` já traz os campos; OpenCode confirma que lê |
| 2 | positivo (Claude) | Modelo **B (anatômico)** primeiro, com T ≈ 0,42·D, base da calota ≤ 50 mm, furos = 0, corpo oval ML ≤ 40 / AP ≤ 25 no corte | renders frente/lateral H44/48/52; validador verde; volume ~30–40 cm³ |
| 3 | positivo (Claude) | Modelos **A** e **C** + folha `COMPARACAO.png` | o cirurgião olha os três e decide D1/D2/D5 |
| 4 | molde (OpenCode) | **M1**: parar de subtrair canal/assento; teste componentes == 1 por metade e "preview ∩ metades = ∅" | `split()` = 1 corpo nas 12 combinações |
| 5 | molde (OpenCode) | **M2 + M9**: pinos centrados no bloco, 1 macho + 1 fêmea por metade em diagonal; teste pino ∩ meia-bloco > 0 | 0 corpos soltos; molde só fecha de um jeito |
| 6 | molde (OpenCode) | **M3 + M5**: `portEnabled=false` default; vent da haste fora da faixa dos pinos; teste de continuidade de canal e de espessura mínima | marcha de pontos vazia em todos os canais; nenhuma parede < 4 mm |
| 7 | molde (OpenCode) | **M4**: batente do tubo (rebaixo com piso 2 mm + furo Ø da alma, ou espigão de 10 mm) e constraint `tubeOD ≤ stemD` | tubo 28 Fr para na sede; 31 Fr com haste 10 é recusado |
| 8 | molde (OpenCode) | **M6 + M7**: `spacerSolid.js` passa a ser o positivo escolhido (import de `positivo/src/models/modelB.mjs` ou a receita da nota 08 §6); espelho AP no teste | preview = positivo (volume ±0,5 %); espelho y→−y = original |
| 9 | todos | **M8/P1/S3**: uma constante de cimento (~45–48 cm³/sachê + 20 % perda), gramas totais de antibiótico e teto 8 g/40 g na saída | H48 → 1–2 sachês, como o StageOne |
| 10 | molde (OpenCode) | **M10**: faces planas paralelas + orelhas com furos M5 + fendas de alavanca + sulco de rebarba | o cirurgião vê como fecha e como abre |
| 11 | molde (OpenCode) | **M13/M14**: página = casca fina sobre `generateSpacerMold` (presets, sliders, explodida, 3 STL + JSON); consertar ou aposentar `moldEngine.js` | 1 motor; sem "manifold OK" em cavidade fechada |
| 12 | molde (OpenCode) | **M11/M12 + baixas**: haste cônica, perfil de material (bancada/clínico), `delete()`, rótulos, orientação de impressão, README do servidor | — |
| 13 | bancada | Cupons de calibração (folga de pino 0,1–0,4; sede do tubo 0,1–0,5); medir ID dos tubos do estoque com paquímetro | `pinClearance` e `tubeClr` fixados |
| 14 | bancada | Molde H48 em PETG 100 %: encaixe, fechamento, **gesso/silicone** (sem calor), desmoldagem, marca de camada na cabeça | — |
| 15 | bancada | Mesmo molde com **cimento de verdade**, termopar na parede da cabeça; pesar a peça curada; óleo mineral × bacitracina | constante de cimento calibrada; pico de temperatura medido |
| 16 | regulatório | Cotação PA12 (bureau com laudo), conversa com CME/CCIH, ficha de prescrição, CEP/TCLE; conferir ANVISA para Subiton/BIOFIX de ombro | caminho escrito antes de qualquer uso clínico |

---

## 7. O que ainda não foi verificado

- **Densidade do PMMA curado com antibiótico e ZrO₂** (1,18–1,30 g/cm³ são estimativas; Heraeus não publica) → cm³ por sachê. Só a bancada (pesar/deslocar em água) fecha isso.
- **Ø interno dos tubos torácicos Argyle por Fr** (só o OD é publicado; 28 Fr = 9,3 mm OD). Medir com paquímetro.
- **Temperatura na interface molde × cimento** numa cabeça de 44–52 mm (Carli/Hoyt mediram o núcleo, não a parede). Termopar no passo 15.
- **Fluência do molde impresso sob o grampo no pico térmico** (PETG e BioMed Amber).
- **Dimensões, IFU e registro ANVISA do Subiton HA48 e do BIOFIX** — o avaliador comercial abriu as páginas; eu não. Pedir ficha técnica aos dois.
- **Calques do SYNICEM medidos por pixel** (largura frontal 29–40 mm, cone da haste ≈ 1°, NSA ~135) — medida do avaliador, não conferida em desenho cotado.
- **Material/liga do molde Ascend Flex** de Klosterman (o artigo não diz).
- **Quanto maior que a anatômica a cabeça deve ser** — nenhum estudo compara; decisão clínica.
- **Função do sulco longitudinal da Tecres** e ganho real de eluição com textura (Duey 2012 não achou diferença).
- **Liberdade de operação** frente às patentes Heraeus (US 11,865,006 / 11,998,451) e Tecres (US 10,123,877) — só para uso comercial; análise jurídica.
- **Os 12 STLs**: eu re-medi 3 combinações (h44_s8, h48_s10, h52_s14); as outras 9 têm o mesmo código e o avaliador de engenharia reportou o mesmo padrão em todas, mas não as abri.
- **A página `moldapp` no browser** (e2e em Chrome headless foi da sessão OpenCode); eu li o código e medi os STLs que ela gerou (`out/spacerMold_A/B.stl`), não a rodei.
