# RESEARCH — Molde impresso em duas metades para espaçador umeral de cimento com antibiótico

Pesquisa paralela (não é o produto SchulterPlan). Data: 25/set/2026. Dono das decisões clínicas:
Dr. Bruno Gobbato. Este documento consolida as notas de `research/01`–`08`. Cada afirmação aponta
para a nota ou para a fonte. **NÃO VERIFICADO** marca o que não foi confirmado em fonte primária.

## 0. Resumo

1. **Ninguém publicou um molde impresso em 3D para espaçador de infecção do ombro.** Existem moldes
   comerciais (metal, silicone, plástico) e moldes impressos para outras articulações (`03` §0).
2. A técnica de referência (Klosterman 2021) usa um **molde metálico comercial em duas metades
   anterior/posterior**, enchido a céu aberto, e faz a haste distal num **dreno de tórax** sobre um fio
   de 2,5 mm (`01` §0). É o mesmo conceito que o cirurgião quer, só que paramétrico e impresso.
3. O mercado confirma o conceito: o **G21 SpaceFlex = Arthrex CeMend** é feito de "duas meias-moldes
   plásticas + haste de inox com 2 pinos de centragem" (`02` §2.2).
4. Falhas mecânicas publicadas: **fratura do espaçador ~5–8 %**, luxação 0,7–56 %, rotação e erosão
   frequentes (`02` §4, `04` §3). Reforço metálico é quase universal.
5. Normal: cabeça R 21–26,5 mm, altura 14,4–18,8 mm, NSA 132–142° (Hertel 2002). Nenhum estudo diz
   quanto maior que a anatômica a cabeça do espaçador deve ser: é decisão clínica (`04` §4.4).
6. **O calor do cimento é o risco central do molde impresso**: o núcleo do PMMA passa de 100 °C em
   massas de espaçador; PLA amolece a ~59 °C (`03` §2, `05` §3).
7. Para uso no centro cirúrgico, o material melhor documentado é **PA12 em pó (MJF/SLS)**; para
   protótipo, **PETG** 100 % preenchido (`05` §0).
8. O gerador de referência (mold-maker) é **PolyForm Noncommercial**: só ideias, código escrito do zero
   (`08` §3). O repo já carrega **manifold-3d 2.5.1** e three 0.160.0 (`08` §5).
9. Geometria medida no úmero do repo + SSM + biblioteca: família S/M/L/XL, cabeça padrão Ø 48,
   espaçador moldado de 20–46 cm³, spike CSG em ~0,1 s sem contrassaída (`07`).
10. **No Brasil não há isenção para o hospital fabricar** o molde; a esterilização de produto sem registro
    no CME esbarra na RDC 15/2012 art. 9º (`06` TL;DR). Isto é pesquisa, não parecer jurídico.

## 1. Escopo travado pelo cirurgião

- **Só úmero.** Sem glenoide, sem acromioclavicular.
- **Tuberosidades presentes** → o espaçador tem a forma de uma **prótese anatômica**: corpo
  intramedular dentro da metáfise, abaixo de um corte no colo anatômico, e **uma cabeça** lisa no
  plano de corte, unidas por um colo robusto de cimento, **sem cone**. Sem furos, sem aletas finas.
- **Cabeça** = esfera lisa dimensionada por um úmero **normal** (valores normativos), provavelmente
  maior que a anatômica. A cabeça artrósica do paciente nunca é o molde.
- **Haste distal** pela técnica do dreno de tórax (Klosterman 2021).
- **Produto final**: página estática geradora (HTML + Three.js por importmap + manifold-3d WASM, sem
  build), onde o cirurgião escolhe o Ø da cabeça e o tamanho do corpo e baixa os STL do espaçador e das
  duas metades do molde. Parecido com https://matta174.github.io/mold-maker/ , mas paramétrico.
- **Nunca copiar implante comercial**; a biblioteca do repo é só referência de tamanho.

## 2. Técnica de referência: Klosterman et al., Arthrosc Tech 2021 (PMC7917196)

Fonte: https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/ ; vídeo mmc1.mp4 (baixado do pacote do
Europe PMC; os quadros não são publicados aqui — licença CC BY-NC-ND). Leitura integral em `01`.

| Item | O que o artigo e o vídeo mostram | Fonte |
|---|---|---|
| Molde | "Aequalis Ascend Flex Convertible Shoulder System Molds" (Wright Medical): **metal**, 4 blocos de haste (tamanhos 2, 4, 6, 8) e 3 meias-cúpulas de cabeça (43 × 16, 48 × 18, 52 × 23 mm) aparafusadas ao bloco no plano de ressecção | `01` §0, §8 |
| Partição | plano que contém o eixo da haste e o eixo do colo → metades **anterior e posterior**; a partição corta a cabeça num meridiano | `01` §8 |
| Registro | 2 pinos machos abaulados numa metade (próximo-lateral e disto-medial, em diagonal), 2 furos na outra | `01` §8 |
| Fechamento | 1 grampo em C sobre faces externas planas e paralelas | `01` §8 |
| Enchimento | **a céu aberto**, metade por metade; sem canal de injeção nem respiros; excesso sai pela partição | `01` §4.7 |
| Distal | cone distal que não se enche; por ali saem o fio e o **dreno de tórax** (24–34 Fr) | `01` §4.4, §8 |
| Reforço | fio-guia de fresagem **2,5 mm com ponta em bola**, do fim do dreno até dentro da cabeça | `01` §0 |
| Cimento | Palacos R + **3,6 g tobramicina + 2,0 g vancomicina por pacote**; 2 pacotes usuais, "planeje 3 na 1ª vez" | `01` §4.6 |
| Desmoldante | **óleo mineral** no molde e dentro do dreno, "crucial" | `01` §4.5 |
| Presa | ~16 min, variável | `01` §4.7 |
| Extração | abre o dreno com lâmina, solta o grampo, separa as metades, **empurra com impactor e martelo**, lima a rebarba ("atenção à superfície articular") | `01` §4.8 |
| Erro do artigo | o texto diz "3 mm = 1 Fr"; o correto é **1 Fr = 1/3 mm** (Fig 2 e vídeo corretos) | `01` §4.2 |
| Críticas posteriores | haste em dreno com pouca rigidez, fratura, poucos diâmetros, rotação (Beady 2025; Adan 2026) | `01` §12 |

Catálogo e material exatos do molde Ascend Flex: **NÃO VERIFICADO** (não está no catálogo público; `01` §13).

## 3. Mercado (detalhes e URLs em `02`)

| Produto | Tipo | Cabeças (mm) | Alma metálica | Antibiótico | Observação |
|---|---|---|---|---|---|
| Tecres Spacer-S / InterSpace Shoulder | pré-formado | 41 × 16, 46 × 22; 130° | aço inox (desde K112983, 2011) | só gentamicina (0,4/0,8 g) | IFU: cimentar o proximal se instável |
| OsteoRemedies REMEDY | pré-formado modular | 40, 45, 50 (cabeça rosqueada); 130° | só na haste | gentamicina | cimento proximal "obrigatório" contra rotação |
| Synimed SYNICEM | pré-formado | 40, 48 (NÃO VERIFICADO no site) | aço 316L | gentamicina | pontos de sutura; K242865 |
| G21 SpaceFix = Arthrex CeMend Spacer | pré-moldado | 4 tamanhos (leitura dos códigos NÃO VERIFICADA) | aço 316LVM | gentamicina | K252443 (09/2025) |
| Zimmer Biomet StageOne Shoulder | **molde de silicone** | 42 × 18 … 58 × 24 (5 tamanhos) | **não** | Refobacin R (K221968) | 1–2 misturas de 40 g; ~US$ 9.837 num revendedor |
| G21 SpaceFlex = Arthrex CeMend Mold | **2 meias-moldes plásticas** + haste de inox com 2 pinos de centragem | 42 (offset 15), 48 (offset 18) | sim | G3A baixa viscosidade | **o mais próximo do nosso conceito**; K202338 |
| Osartis Shoulder Spacer Molds | molde descartável | NÃO VERIFICADO | inox + centralizadores | Cemex Genta LV | K240856; biocompatibilidade como "implant device", contato indireto > 30 dias |
| Wright/Tornier Ascend Flex molds | molde metálico | 43 × 16, 48 × 18, 52 × 23 | fio 2,5 mm (Klosterman) | livre | status atual NÃO VERIFICADO |

- Heraeus, implantcast, LIMA, DePuy e Exactech: sem produto próprio de ombro encontrado; o "InSpace"
  é balão subacromial, não espaçador (`02` §0, §2.5).
- **Brasil**: nenhum espaçador ou molde de ombro com registro ANVISA confirmado (a consulta bloqueou o
  acesso automatizado; `02` §8). NÃO VERIFICADO.
- **Patentes** a considerar antes de qualquer uso comercial: Heraeus US 11,865,006 (molde em 2 partes
  haste + cabeça com flange, ~2041), US 11,998,451 (válvula de enchimento, ~2042), Tecres US 10,123,877
  (espaçador modular, ~2035). O nosso conceito (metades A/P, cilindros macho/fêmea, sem flange, sem
  válvula) é outra arquitetura, mas precisa de análise de liberdade de operação (`02` §7).

### 3.1 Abordagens comparadas (`02` §5)

| | Pré-formado | Kit de molde | Feito à mão | Molde impresso (nossa proposta) |
|---|---|---|---|---|
| Geometria | fixa, 2–3 tamanhos | 5–46 configurações | livre | paramétrica |
| Antibiótico | só o de fábrica | o cimento do 510(k) | livre (off-label) | livre (off-label) |
| Alma metálica | sim | depende | improvisada | fio/pino escolhido pelo cirurgião |
| Custo | alto | alto | o menor (≥ 40–50 % mais barato em quadril/joelho, Moerenhout 2021) | impressão + cimento |
| Regulatório | 510(k) classe II | 510(k) classe II | uso off-label do cimento | sem registro (ver §12) |

## 4. Complicações mecânicas publicadas (`02` §4, `04` §3)

| Estudo | n | Fratura do espaçador | Luxação | Outras |
|---|---|---|---|---|
| Alessio-Mazzola 2020, revisão sistemática — https://pmc.ncbi.nlm.nih.gov/articles/PMC7534885/ | 143 | 8 (5,6 %) | 1 (0,7 %; o artigo imprime "0,1 %") | fratura periprotética 2,1 % |
| McFarland 2018 — https://pubmed.ncbi.nlm.nih.gov/29778591/ | 50 revisados | 4 | — | rotação 3, erosão 8, fratura umeral 3 |
| Da Silva 2025, REMEDY — https://pmc.ncbi.nlm.nih.gov/articles/PMC12490687/ | 53 | 3 (5,7 %) | 7 (13,2 %) | soltura 7,5 %; fratura umeral na implantação 7,3 % (`04` §6) |
| Beady 2025, Frankenspacer — https://pmc.ncbi.nlm.nih.gov/articles/PMC12573618/ | 18 | 0 (Steinmann + haste IM) | 10 (56 %), com perda óssea | erosão glenoidal 83 % |
| Jawa 2011, PROSTALAC ombro | 28 | 3, **todas com placa 1/3 tubular** | 1 | — |
| Aibinder 2019 | 27 | — | — | instabilidade rotacional 3 (o artigo imprime 4 %; 3/27 = 11 %) |

Leituras: (a) fratura concentra-se em alma fraca ou ausente; (b) luxação piora muito com perda
óssea proximal — no nosso escopo as tuberosidades estão presentes; (c) rotação pede corpo não
circular na metáfise.

## 5. Moldes impressos em 3D (`03`)

- Nenhum para infecção do ombro. Ombro impresso só em tumor (Ke 2024, 13 úmeros proximais, "molde
  destacável"; só o resumo; material desconhecido; 1 revisão por fratura, 2 subluxações).
- Outras articulações: PLA (calcâneo, casca de 2 mm, descascada de propósito porque amoleceu), náilon
  SLS (úmero distal, parede 3 mm, autoclavado, 2 metades), resina (ulna, plasma de H₂O₂), silicone
  sobre mestre impresso (joelho, autoclave 140 °C/60 min), CoCr SLM (tálus, ~US$ 8.000, isenção de
  dispositivo custom nos EUA) (`03` §1, §5.6).
- Nenhum repositório público de STL de molde de espaçador médico foi encontrado (`03` §7).

## 6. Requisitos clínicos que viram geometria (`04`)

| Tema | O que a literatura diz | Consequência no desenho |
|---|---|---|
| Cabeça — normal | R 24 ± 2,1 mm, altura 19 ± 2,4 (Iannotti 1992); R 21–26,5, altura 14,4–18,8, altura/raio 0,64–0,77, NSA 132–142°, offset medial 3,9–8,6 (Hertel 2002) | padrão Ø 48, h = 0,72·R, NSA 135° (`07` §4) |
| Cabeça — tamanho × desfecho | maior → menos translação e menos movimento (Harryman 1995, Blevins 1998); cabeça 5 mm alta → −10° de abdução (Nyffeler 2004); overstuffing dá dor e rigidez (Matsen 2025); tamanho não se associou a erosão glenoidal em hemi (Herschel 2017) | faixa larga (40–58) com aviso; mostrar altura do topo da cabeça |
| Cabeça — espaçadores | 40–58 mm no mercado; nenhum estudo compara cabeça sobredimensionada × anatômica | **decisão do cirurgião** |
| Junção cabeça-corpo | nenhum espaçador publicado usa cone; cabeça moldada junto ou colada com cimento | monobloco, junção = pegada inteira do corpo |
| Haste / corpo | haste solta ou levemente justa, não cimentada em toda a extensão; remoção por impacção; cimento distal retido complica | corpo liso, sem furos, sem rebaixos; afilado distal |
| Rotação | 3/50 (McFarland), 3/27 com perda óssea (Aibinder) | secção **não circular** na metáfise |
| Reforço | fio 2,5 mm (Klosterman); Steinmann 2,4 (Kim 2022, 0 fraturas em 11); Steinmann + haste IM (Frankenspacer, 0/18); Rush centralizado (Adan 2026); placa 1/3 tubular falhou (Jawa) | canal central **no plano de partição**, do fundo da cabeça à saída distal; bitola é escolha clínica |
| Resistência | todas as combinações com vancomicina < 50 MPa em flexão após 6 semanas (Lunz 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9617327/) | secções grossas; alma metálica |
| Antibiótico | "dose alta" ≥ 3,6 g/40 g com ≥ 2 g vancomicina; evitar > 8 g/40 g; usar pó, nunca líquido (Samelis 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8815820/) | fora do molde; o gerador só lembra a receita e a responsabilidade |
| Volume | 1 pacote Palacos curado = 57 g (Satish 2018); StageOne pede 1–2 misturas; Klosterman 2–3 pacotes | o gerador calcula cm³ e pacotes com constante calibrável |
| Suturas | nenhum espaçador de ombro publicado tem furos de sutura; tuberosidade preservada = melhor prognóstico (Verhelst 2011) | **sem furos** |
| Superfície | cabeça lisa; eluição depende de área/volume (Duey 2012) | cavidade da cabeça lisa; textura só se o cirurgião pedir, nunca na haste |

## 7. Materiais e esterilização do molde (`05`)

- **Autoclave**: PLA, PETG, ABS, PC genérico e náilon FDM **deformam** (Popescu 2025, Valls-Esteve 2023,
  Pérez-Davila 2022). Vão para H₂O₂ (VH2O2/plasma) ou óxido de etileno (`05` §2).
- **PA12 em pó (MJF HP HR PA 12 ou EOS PA 2200)**: único material comum que passou em vapor 121 °C,
  vapor 134 °C e H₂O₂ com Δ 0,02–0,04 mm (Valls-Esteve 2023); HDT 175 °C (0,45 MPa); laudos USP VI e
  ISO 10993 do fabricante (HP só com o pós-processo dele). Contra: superfície granulosa, Sa ≈ 28 µm.
- **Formlabs BioMed Amber (SLA)**: melhor acabamento (Sa 6,7–8,5 µm em mSLA); ISO 10993-5/-10/-11;
  autoclave 121 °C/30 min ou 134 °C/20 min; **HDT 78 °C** e frágil. Já publicada como molde de PMMA,
  mas só em peças pequenas (Beitler 2022, hemisférios Ø 25 mm).
- **PEEK / ULTEM 1010 certificado**: maior margem térmica, impressora de alta temperatura.
- **Silicone sobre mestre impresso**: autoclavável, dispensa desmoldante, superfície menos precisa.
- **Desmoldante** (Beitler 2022, molde BioMed Amber): pomada de **bacitracina 9,1 N**, óleo mineral
  104,9 N, sem nada 339,3 N, géis aquosos piores. Klosterman: óleo mineral "crucial".
- **Resina DLP comum quebrou** ao desmoldar porque o PMMA dilata na cura (Nguyen 2023) → zero
  contrassaída e partição no equador.
- **Ranking** (`05` §0): protótipo = PETG FDM 100 % (ou SLA para julgar acabamento; PLA só para
  geometria); centro cirúrgico = **PA12 em pó**, depois BioMed Amber (121 °C), PEEK/ULTEM, silicone.

## 8. Calor do cimento × molde

- Núcleo do PMMA em massas de espaçador: **115,2 °C** num molde tibial de silicone (Carli 2018),
  112,8 °C num bloco 8 × 5 × 3 cm; > 100 °C por ~3 min (`03` §2.1). O molde isolante esquenta mais o
  núcleo (`03` §0).
- Temperaturas de amolecimento (HDT, 0,45 MPa): PLA ~59 °C, PETG 68–77 °C, ABS 87 °C, PC 105 °C,
  PA12 SLS 145–157 °C (57–64 °C a 1,8 MPa), BioMed 67–78 °C (`03` §2.2).
- A temperatura na **interface molde × cimento** não foi medida em nenhuma fonte → **medir com
  termopar no protótipo** (`05` §3). A cabeça de Ø 48–56 mm é a região mais crítica (17–27 cm³ de cimento).

## 9. Engenharia do molde: o que patentes, produtos e artigos especificam (`03` §5)

| Item | Referência | Nossa leitura |
|---|---|---|
| Partição | plano coronal, metades espelhadas (Biomet US7637729B2); A/P em Klosterman | plano que contém o eixo da haste e o do colo |
| Registro | pinos e furos; lingueta e ranhura; folga de impressão 0,2 (SLA/SLS pequeno) a 0,4 mm (grande) (Formlabs); geradores usam 0,15–0,2 mm | 2 cilindros, 1 macho + 1 fêmea por metade, folga calibrável |
| Fechamento | grampo em C (Klosterman); parafusos M4/M5 com porca embutida (moldmaker, MIT) | faces externas planas e paralelas; furos passantes opcionais |
| Porta de enchimento | em área **não articular**, para seringa de 60 mL; sem porta (Heraeus: cavidade aberta) | Klosterman enche a céu aberto; porta é opcional |
| Respiros | deixam passar ar e seguram cimento; transbordo = molde cheio (Zimmer, Broughton) | canais de transbordo na partição, longe da cabeça |
| Parede publicada | 2 mm PLA descartável, 3 mm náilon SLS, 5 mm resina, ≥ 12 mm silicone | 8 mm no spike (lugar para as chaves) |
| Contração do PMMA | 3–7 % em volume; ~0,75–1,15 % no diâmetro (Boote 2020) | compensação opcional 0–1 % no diâmetro |
| Reforço e molde | projeções de centragem da alma (Zimmer); haste com 2 pinos de centragem (CeMend) | canal/guia do fio no plano de partição |

## 10. Geometria medida (`07`)

- Úmero do repo (`data/humerus.obj`): proximal direito, 148,5 mm, **casca cortical com canal**;
  esfera da cabeça R 24,69 mm (RMS 0,32). SSM médio: R 23,75 mm. Mediana normativa R 24 → **Ø 48**.
- A detecção automática do colo e do NSA falhou nas duas malhas (como o invariante do repo prevê);
  usou-se um corte de referência a 135° com calota de 0,72·R.
- Canal diafisário do úmero demo: Ø equivalente 11–15 mm (−40 a −120 mm). O endósteo metafisário
  segmentado é irregular: **até a haste real Ø 7 mm falha nele (controle)** → o envelope da metáfise
  tem de vir do paciente (fresa/TC), não de um úmero típico.
- Corpo proximal das hastes da biblioteca, 20 mm abaixo do corte: ML 16–29 × AP 12–25 mm, com aletas,
  furos e poroso que o espaçador **não** copia.
- Família proposta S/M/L/XL (ML 20–32 × AP 14–20 no calcar; 50–65 mm de corpo); cabeça Ø 40–58,
  padrão 48; offset medial anatômico de 6 mm com o ombro lateral do corpo a 5 mm do eixo, para a
  base da cabeça cobrir a pegada do corpo.
- Spike manifold-3d 2.5.1: 48 combinações, gênero 0, **0 mm² de contrassaída**, metades sem
  interseção, **~50 ms + ~40 ms**; espaçador moldado **20–46 cm³**.
- Dreno: Ø externo = Fr/3 (24 Fr 8,0 … 36 Fr 12,0 mm); Ø interno **NÃO VERIFICADO**.

## 11. Software (`08`)

- **mold-maker** (matta174): React/TypeScript + manifold-3d 3.4.1 num worker; pipeline caixa →
  subtração → divisão → 4 pinos → sprue 2:1 → respiros → STL/OBJ/3MF/STEP; folga 0,15 mm; parede 8 %
  da maior dimensão; não libera memória WASM (`08` §2).
- **Licença PolyForm Noncommercial 1.0.0** (lida na íntegra): proíbe copiar, traduzir ou fazer fork
  para fim com aplicação comercial prevista. Pode-se estudar e reaproveitar **ideias e números**.
  Decisão: **escrever do zero** sobre manifold-3d (Apache-2.0) e three.js (MIT) (`08` §3). Não é
  parecer jurídico.
- O SchulterPlan carrega `manifold-3d@2.5.1` e `three@0.160.0` do jsdelivr por importmap em 9
  páginas; `js/biorsa/manifoldUtils.js` tem `initManifoldEngine`, `manifoldToGeom`, `manifoldCheck`
  (`08` §5). Regras da casa: não compor `rotate()` a partir de Euler do THREE; materializar com
  `getMesh()`; liberar com `delete()`.
- Outros geradores (Webb/OpenSCAD, BOSL2, moldmaker MIT, STL_Mold_Maker GPL) ensinam chaves
  hemisféricas, folga global calibrável e chanfro de entrada (`08` §4, §7.2).
- A pasta `spacer/` **não é publicada** pelo `.vercelignore` (allowlist); uma página na raiz seria
  (`08` §5). Esta pesquisa não publica nada.

## 12. Regulatório (resumo de `06`; não é parecer jurídico)

- **Brasil**: RDC 925/2024 (substituiu a RDC 305/2019) mantém *sob medida*, *paciente-específico* e
  *adaptável*. Não há isenção para fabricação no hospital. Um gerador paramétrico cabe na definição
  de paciente-específico; para ser *sob medida* o projeto precisa sair de uma **prescrição do
  cirurgião com características de projeto** → o gerador deve emitir uma **ficha de prescrição
  assinável**. CME só processa produto regularizado (RDC 15/2012 art. 9º).
- **EUA**: moldes de espaçador são 510(k) classe II (MBB, 21 CFR 888.3027); há 4 de ombro
  (K131135, K160071, K221968, K240856). O documento de discussão do FDA (dez/2021, não é norma) diz que o hospital que imprime pode ser
  fabricante. A isenção de dispositivo custom é limitada a 5 unidades/ano.
- **UE**: impresso em 3D não é *custom-made* por padrão; guias de corte são exemplo de
  paciente-específico (MDCG 2021-3).
- **Cimento com antibiótico misturado à mão = off-label** (Parecer CFM 2/2016); a bula do Palacos R
  proíbe misturar substâncias e contraindica uso com infecção ativa (`01` §9).
- Documentação mínima por caso: ficha de projeto assinada (versão do gerador + hash do STL),
  registro de fabricação e esterilização, TCLE específico, rastreabilidade do cimento e do antibiótico.

## 13. Itens NÃO VERIFICADOS que importam

1. Ø interno dos drenos de tórax por Fr (não publicado; medir com paquímetro).
2. Densidade do Palacos curado com antibiótico → cm³ por pacote (pesar a peça).
3. Temperatura na interface molde × cimento numa cabeça de 48–56 mm (termopar no protótipo).
4. Deformação/fluência do molde impresso sob o grampo durante o pico térmico.
5. Folga real das chaves e da sede do dreno na impressora escolhida.
6. Ataque do monômero MMA a PC e náilon impresso (teste com cupom).
7. Registro ANVISA de algum espaçador ou molde de ombro.
8. Material e status do molde Ascend Flex usado por Klosterman.
9. Se o SSM de 149 formas do repo é de úmeros normais.
10. Quanto maior que a anatômica a cabeça deve ser (nenhum estudo).
11. Liberdade de operação frente às patentes Heraeus e Tecres (análise jurídica).
12. Bitola ideal do reforço metálico no espaçador moldado (só séries pequenas).

## 14. Fontes

Notas completas, cada uma com a lista de URLs lidas:
`research/01_artigo_referencia.md` (Klosterman + vídeo + citações) ·
`research/02_opcoes_comerciais.md` (produtos, 510(k), patentes, taxas) ·
`research/03_moldes_impressos.md` (moldes impressos, calor, desmoldante, patentes de molde) ·
`research/04_requisitos_clinicos.md` (≈ 65 fontes clínicas) ·
`research/05_materiais_esterilizacao.md` (47 fontes de material e esterilização) ·
`research/06_regulatorio.md` (Anvisa, FDA, MDR) ·
`research/07_geometria.md` (medidas e spike, com scripts) ·
`research/08_mold_maker.md` (código e licença do mold-maker, manifold no repo).
`research/RESEARCH_SHOULDER_SPACERS.md` veio de uma rodada anterior: tem o erro "3 mm = 1 Fr" e
subestima o mercado; usar só onde coincide com as notas 01–08 (`07` §10).

Fontes primárias mais citadas:
- Klosterman 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/
- Beady 2025 (Frankenspacer) — https://pmc.ncbi.nlm.nih.gov/articles/PMC12573618/
- Adan 2026 — https://pmc.ncbi.nlm.nih.gov/articles/PMC13332471/
- Da Silva 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12490687/
- Alessio-Mazzola 2020 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7534885/
- Lunz 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9617327/
- Samelis 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8815820/
- Hertel 2002 — https://doi.org/10.1067/mse.2002.124429 (resumo)
- Iannotti 1992 — https://doi.org/10.2106/00004623-199274040-00004 (resumo)
- StageOne Shoulder (folheto) — https://www.zimmerbiomet.com/content/dam/zb-corporate/en/products/specialties/cement/stageone-cement-spacer-molds/5426.1-US-en%20StageOne%20Shoulder%20Brochure%20final.pdf
- K202338 (SpaceFlex) — https://www.accessdata.fda.gov/cdrh_docs/pdf20/K202338.pdf
- mold-maker — https://github.com/matta174/mold-maker
