# 03 — Moldes impressos em 3D para espaçadores de cimento com antibiótico

Pesquisa de apoio ao gerador paramétrico de molde do espaçador umeral (fase 1: corpo proximal + cabeça,
molde em duas metades anterior/posterior com dois cilindros de registro). Escopo: literatura e
relatórios técnicos sobre moldes impressos (qualquer articulação), materiais, espessura de parede,
linha de partição, registro, canal de enchimento, respiros, desmoldante, calor da polimerização do PMMA
× temperatura de amolecimento do plástico, precisão, problemas relatados e projetos abertos.

Data da pesquisa: 25/set/2026. Tudo o que não consegui ler no texto completo está marcado
**NÃO VERIFICADO**. Nenhum número abaixo foi inventado; cada um tem fonte.

---

## 0. Resumo em 12 linhas

1. **Não achei nenhum artigo de molde IMPRESSO em 3D para espaçador de PJI do ombro.** O que existe no
   ombro: moldes comerciais (Wright/Tornier Aequalis Ascend Flex no Klosterman 2021; Arthrex CeMend;
   Zimmer Biomet StageOne) e moldes impressos para reconstrução após TUMOR do úmero proximal
   (Ke 2024, 13 casos) — material do molde não aparece no resumo.
2. Moldes impressos em outras articulações usaram: **PLA** (calcâneo, Goh 2025), **resina** fotopolimérica
   (ulna, Alaseem 2025; cranioplastias), **náilon SLS/PA** (úmero distal, Chen 2022; tíbia, Zheng 2023),
   **silicone vazado sobre mestre impresso** (joelho, Kong 2021; quadril, Zhang 2024) e **CoCr
   impresso em metal** (tálus, Broughton 2021, ~US$ 8.000).
3. O PMMA dentro de um molde de espaçador passa de **100 °C no núcleo**: 115,2 °C em molde tibial de
   silicone (Carli 2018), 112,8 °C num bloco 8×5×3 cm (Hoyt 2023); >100 °C por 3 min.
4. PLA tem Tg ≈ 59 °C e HDT ≈ 59 °C; PETG/co-poliéster HDT 68–77 °C; ABS 87 °C; PC 105 °C;
   **PA12 SLS HDT 145–157 °C (0,45 MPa)**; resinas Formlabs BioMed 67–78 °C (mas autoclaváveis a 134 °C).
   **PLA amolece com o calor do cimento** — um grupo usou isso de propósito para descascar o molde (Goh 2025).
5. Esterilização: PLA/PETG **deformam na autoclave a 121 °C**; H₂O₂-plasma e óxido de etileno
   mantêm < 0,6 mm (Rynio 2022). PA12 e resinas aguentam autoclave.
6. Desmoldante: **pomada de bacitracina** foi a melhor (9,1 N de força de extração vs 339 N sem nada);
   óleo mineral 105 N (Beitler 2022). Klosterman: óleo mineral é "crucial". Géis à base de água pioram.
7. Linha de partição no **plano coronal** (patente Biomet), pinos/lingueta de registro, **porta de
   injeção em área NÃO articular**, respiros que deixam passar ar e seguram cimento, e **transbordo pelos
   respiros como sinal de molde cheio** (patentes Zimmer/Biomet; Broughton 2021).
8. Espessuras de parede publicadas: 2 mm PLA (descartável/descascável), 3 mm náilon SLS, 5 mm resina,
   ≥12 mm silicone.
9. Contração do PMMA: 3–7 % em volume (≈0,75–1,15 % no diâmetro de um manto acetabular).
10. Reforço metálico interno (haste/pino) é regra nos espaçadores; o molde precisa de canal e centragem.
11. Projetos abertos de gerador de molde existem (mold-maker, moldmaker MIT, STL_Mold_Maker GPL), mas
    **nenhum repositório público de STL de molde de espaçador médico** foi encontrado.
12. O `mold-maker` de referência é **PolyForm Noncommercial 1.0.0** — não copiar código para produto comercial.

---

## 1. Estudos clínicos e técnicos com molde impresso (ou mestre impresso)

| # | Estudo | Sítio | Como o molde foi feito | Esterilização | Desmoldante / desmoldagem | Observações úteis |
|---|---|---|---|---|---|---|
| 1 | Goh BHE, Tee KK, Paul AG. Rev Bras Ortop 2025;60(2) — doi:10.1055/s-0045-1809420 — [PMC12213075](https://pmc.ncbi.nlm.nih.gov/articles/PMC12213075/) | Calcâneo (GCT) | **PLA**, impressora doméstica (Bambu/Creality/Kokoni citadas), 3D Slicer + Fusion 360, **2 metades**, casca de **2 mm** | Gás (PLA "heat labile") | Cada metade forrada com **Ioban** e **parafina líquida**; metades "clasped together" com tela de Prolene no meio; "the hardened mold shell softens during the exothermic phase ... enabling it to be peeled off easily" | Casca fina de propósito para ser maleável e descascar. Custo "minimal". Sem sprue/respiros descritos. |
| 2 | Chen J, Zhang W, Chen P. JSES Rev Rep Tech 2022;2(4):584–591 — doi:10.1016/j.xrrt.2022.06.004 — [PMC10426601](https://pmc.ncbi.nlm.nih.gov/articles/PMC10426601/) | Úmero distal | **Náilon por sinterização a laser (EOS)**; superfície espelhada, **offset/espessura 3 mm**, "divided into 2 parts to ensure that the mold can release the cement prosthesis smoothly" (Mimics, Geomagic, Freeform) | Autoclave ("high temperature and high pressure") | Cimento vertido e **retirado antes de endurecer totalmente** | Parede de 3 mm em PA SLS + autoclave funcionou. |
| 3 | Zheng K et al. Orthop Surg 2023;15(10):2724–2729 — doi:10.1111/os.13779 — [PMC10549869](https://pmc.ncbi.nlm.nih.gov/articles/PMC10549869/) | Tíbia proximal (criança, osteossarcoma + infecção) | **4 peças de náilon + superfície articular em liga de titânio**, parafusadas | NÃO VERIFICADO (não descrito) | **Óleo de parafina** dentro do molde + **retirada antes da cura completa** "para evitar adesão" | Superfície articular metálica para melhor acabamento. |
| 4 | Kong L et al. BioMed Res Int 2021;3948638 — doi:10.1155/2021/3948638 — [PMC7884112](https://pmc.ncbi.nlm.nih.gov/articles/PMC7884112/) | Joelho (PJI, série retrospectiva) | Mestre impresso em **náilon FDM** (OpenSCAD) → **molde de silicone** 1:1, vácuo 100 Pa, cura a 60 °C por ~8 h | **Autoclave 140 °C, 60 min** | Cimento "injected, and pressed"; 8–10 min em temperatura ambiente; 50–60 g por espaçador | 1 g vanco + 0,8 g meropeném + 0,4 g fluconazol + 0,3 g isoniazida por 40 g (Heraeus). |
| 5 | Zhang H et al. Int J Antimicrob Agents 2024;63(3):107080 — doi:10.1016/j.ijantimicag.2023.107080 — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924857923003692) | Quadril (PJI, 20 vs 20) | "3D-printed silicone moulds" | NÃO VERIFICADO | NÃO VERIFICADO | Harris Hip Score +11,25 (3 m) e +9,15 (12 m) no grupo 3D. Texto completo pago — detalhes do molde NÃO VERIFICADOS. |
| 6 | Broughton KK et al. 3D Print Med 2021 — doi:10.1186/s41205-021-00117-5 — [PMC8447608](https://pmc.ncbi.nlm.nih.gov/articles/PMC8447608/) | Tálus | **CoCr por SLM** (restor3D), "highly polished"; **linha de partição não plana**; versões **105 % e 95 %** do volume | NÃO VERIFICADO | **Óleo mineral estéril**; mistura a vácuo; seringa de 60 mL na porta; injetado "until cement overflowed all ports"; molde **grampeado por fora** para pressurizar | Porta dimensionada ao diâmetro externo da seringa; **portas em área NÃO articular**; com duas portas, **paralelas** para facilitar a remoção; prever rosca para extrator. Custo ≈ US$ 8.000; < 5 dias. |
| 7 | Alaseem A et al. Curr Oncol 2025;32(8):411 — doi:10.3390/curroncol32080411 — [PMC12384866](https://pmc.ncbi.nlm.nih.gov/articles/PMC12384866/) | Ulna proximal (osteossarcoma) | **Resina lavável em água (não médica)**, impressora LCD (Anycubic/Elegoo, CHITUBOX), espelho da ulna contralateral | **Plasma** | NÃO VERIFICADO | O molde "did not come into direct contact with the patient". |
| 8 | Exner GU et al. JBJS Case Connect 2021;11(2) — doi:10.2106/jbjs.cc.20.00568 — [PubMed 34019491](https://pubmed.ncbi.nlm.nih.gov/34019491/) | Rádio (sarcoma infectado) | Molde impresso a partir da TC | NÃO VERIFICADO | NÃO VERIFICADO | Só o resumo foi lido. |
| 9 | Qu GX et al. Eur Rev Med Pharmacol Sci 2023;27(16):7507–7513 — doi:10.26355/eurrev_202308_33402 | Fêmur distal (osteossarcoma + MRSA) | Molde impresso + PMMA + haste intramedular | NÃO VERIFICADO | NÃO VERIFICADO | Espaçador firme aos 2 anos. Só resumo. |
| 10 | Ke S et al. Surg Innov 2024;31(3):307–317 — doi:10.1177/15533506241244493 — [PubMed 38606504](https://pubmed.ncbi.nlm.nih.gov/38606504) | **Úmero proximal (13) + rádio distal (1)**, tumor | "detachable mold" a partir da TC contralateral | NÃO VERIFICADO | NÃO VERIFICADO | 2 subluxações (14,3 %), **1 revisão por fratura da prótese de cimento (7,1 %)**, MSTS 23,2. **É o mais próximo do nosso caso no ombro**; material do molde NÃO VERIFICADO (texto pago). |
| 11 | Gemalmaz HC et al. Gazi Med J 2018;29(3) — [página](https://medicaljournal.gazi.edu.tr/index.php/GMJ/article/view/1685) | Osteomielite (instabilidade) | Molde impresso a partir da TC do lado sadio | Esterilizado (método NÃO VERIFICADO) | NÃO VERIFICADO | PDF não lido. |
| 12 | Ocampo MGC et al. J Southeast Asian Orthop 2026;50(2):205–8 — doi:10.56929/jseaortho-2026-0323 — [página](https://www.jseaortho.org/index.php/jsao/article/view/323) | Quadril pediátrico (TB) | Molde impresso por medidas do quadril contralateral | NÃO VERIFICADO | NÃO VERIFICADO | Só resumo. |

Moldes NÃO impressos mas com lições diretas:

| Estudo | O que ensina |
|---|---|
| Klosterman EL et al. Arthrosc Tech 2021;10(2):e481–e486 — doi:10.1016/j.eats.2020.10.027 — [PMC7917196](https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/) | Molde comercial **Aequalis Ascend Flex** (Wright) em **2 metades presas com chave hexagonal 3,5 mm**; hastes 2/4/6/8 e cabeças 43×16, 48×18, 52×23 mm. Metades e dreno torácico **untados com óleo mineral — "crucial"**; às vezes precisa de **impactor de cabeça** para tirar o espaçador do molde. Guia de fresagem 2,5 mm com ponta em bola liga o molde proximal ao dreno distal (ponta dentro da cabeça). "2 packs of Palacos to 2.5 doses of liquid monomer" (mais fluido). Cura ≈ 16 min. Material do molde não é dito no texto (NÃO VERIFICADO se é metal). |
| Kohl S et al. Acta Orthop 2009;80(3):389–391 — doi:10.3109/17453670902876771 — [PMC2823218](https://pmc.ncbi.nlm.nih.gov/articles/PMC2823218/) | Molde de **alumínio AA7075** usinado, revestido com **Altef (cerâmica + PTFE, 50 µm)**; fêmur 3 peças, tíbia 2; **2 canais no topo** enchidos com tubo de 20 mL; 2 parafusos; reutilizável. |
| Nguyen QTQ et al. SICOT-J 2023;9:32 — doi:10.1051/sicotj/2023032 — [PMC10644890](https://pmc.ncbi.nlm.nih.gov/articles/PMC10644890/) | Silicone de adição de alta viscosidade (Zhermack elite HD+) sobre o implante retirado; caixa de PVC 5 mm; metade inferior em argila; **parafina entre as metades**; **EtO**; "the cement does not adhere to the molds"; cimento vertido na fase manipulável; **US$ 70 por molde**. |
| Yuen JC et al. Cureus 2022;14(12):e32254 — doi:10.7759/cureus.32254 — [PMC9815779](https://pmc.ncbi.nlm.nih.gov/articles/PMC9815779/) | Silicone industrial sobre implante; **canudos como canais até o implante**; autoclave ("up to 200 °C"); haste de Rush / 3 fios de Kirschner 2,0 mm como reforço. |
| Molde de silicone de joelho, Irã — [PMC11756536](https://pmc.ncbi.nlm.nih.gov/articles/PMC11756536) | Silicone vulcanizado sob pressão a 150 °C (autoclavável, reutilizável); **"accuracy of 1 mm"**; até **US$ 30** por molde. Citação completa NÃO VERIFICADA (não extraída). |

Cranioplastia (PMMA moldado no intraoperatório em molde impresso) — literatura mais rica sobre o
processo de moldar PMMA em plástico impresso:

| Estudo | Material do molde | Esterilização | Lição |
|---|---|---|---|
| Pöppe JP et al. Acta Neurochir 2022;164:679–688 — [PMC8913485](https://pmc.ncbi.nlm.nih.gov/articles/PMC8913485/) | Formlabs **Dental SG / Surgical Guide**, parede de **5 mm** | Autoclave **134 °C ≥ 20 min** | "The heating of PMMA during polymerisation process did not affect the shape or structure of the cured resin templates"; **óleo neutro** fino; anel + tampa encaixados (registro por encaixe). |
| Tel A et al. J Oral Maxillofac Surg 2020;78(12) e Int J Oral Maxillofac Surg 2021;50(12) (via [Formlabs roundup](https://formlabs.com/blog/roundup-pmma-molds/)) | Formlabs **Grey Pro** | **H₂O₂** | **Canais de extravasamento** do excesso de PMMA; desvio **submilimétrico**; **parafina estéril** fina nas câmaras. |
| Csámer L et al. Sci Rep 2023 — doi:10.1038/s41598-023-38772-9 — [PMC10368708](https://pmc.ncbi.nlm.nih.gov/articles/PMC10368708/) | Mestre impresso (Stratasys Connex) → **silicone Protosil RTV 245, 40 Shore A** | Padrão hospitalar | Silicone "heat resistant up to 200 °C", PMMA não adere; **≥ 12 mm de silicone em volta** para não deformar; molde aberto "como um livro" por corte lateral. |
| Early experience LMIC — [PMC9282781](https://pmc.ncbi.nlm.nih.gov/articles/PMC9282781/) | PLA 30 % infill (modelo) + silicone alimentar | Pré-vácuo **121 °C 30 min** (silicone) | Implante retirado após **7–10 min** e **resfriado em soro**; custo médio US$ 40. |
| Lannon M et al. Can J Neurol Sci 2022;49:196–202 — doi:10.1017/cjn.2021.57 | Molde de 2 peças "self-align" em impressora desktop | NÃO VERIFICADO | Resumo lido. A frase "o molde pode ficar impossível de remover após a cura; encerar as superfícies" apareceu só num resumo de busca — **NÃO VERIFICADO** a qual artigo pertence. |

---

## 2. Calor da polimerização × temperatura de amolecimento do molde

### 2.1 Quanto esquenta o PMMA em volume de espaçador

| Fonte | Geometria / molde | Pico |
|---|---|---|
| Carli AV et al. J Arthroplasty 2018;33(6):1930–1935 — doi:10.1016/j.arth.2018.01.034 | Moldes comerciais de **silicone** StageOne (fêmur distal 75 mm, tíbia proximal 80 mm), termopares em várias profundidades | **115,2 °C tibial**, 85,1 °C femoral; **>100 °C por 3 min** no mais quente; Simplex mais quente que Palacos |
| Hoyt AK et al. J Bone Jt Infect 2023;8:175–181 — [doi:10.5194/jbji-8-175-2023](https://jbji.copernicus.org/articles/8/175/2023/) | Bloco de espaçador de joelho **8×5×3 cm** | **112,8 °C**, pico aos 8 min, 38 min para esfriar |
| Hoyt 2023 (mesmo) | Pérola de 10 mm | 61,5 °C |
| Li B et al. Orthop Surg 2023;15(6):1645–1653 — [PMC10235157](https://pmc.ncbi.nlm.nih.gov/articles/PMC10235157/) | Palacos R+G, cuboides 40×40 mm, sonda no **centro** do cimento, apoiados sobre pele | 1 mm 63,3 · 4 mm 73,5 · 8 mm 87,9 · **12 mm 93,0 · 16 mm 93,0 · 20 mm 93,2 °C**; >70 °C por 5,4 / 6,2 / 7,4 min (12/16/20 mm) |
| Li C, Mason J, Yakimicki D. J Mater Sci Mater Med 2004;15(1):85–89 — doi:10.1023/b:jmsm.0000010101.45352.d1 | Mesma massa em molde de PTFE × espuma de PU | Temperatura de presa **~50 °C mais baixa em PTFE** (6 mm); PTFE varia 75 °C entre 6 e 40 mm de altura. **O material do molde muda o pico** (molde isolante = núcleo mais quente). |
| ISO 5833 (via [patsnap](https://eureka.patsnap.com/materials/pmma-bone-cement-analysis)) | Ensaio normalizado | Limite de 90 ± 5 °C no ensaio — o ensaio **subestima** massas grandes (ver Li 2004). |

Leitura para o nosso espaçador: cabeça de 40–55 mm e corpo de 15–25 mm de espessura estão na faixa de
massa do espaçador tibial → esperar **núcleo acima de 100 °C** e superfície do molde bem acima dos 60 °C.
A temperatura da PAREDE do molde impresso durante a cura **não foi medida em nenhum estudo encontrado**
(NÃO VERIFICADO) — teste de bancada necessário.

### 2.2 Temperaturas dos materiais de molde (fichas técnicas oficiais)

| Material | Tg (DSC) | HDT 0,45 MPa | HDT 1,8 MPa | Vicat | Fonte |
|---|---|---|---|---|---|
| PLA (UltiMaker) | 59,1 °C | 58,8 °C | — | 64,5 °C (A120) | [TDS v5.00](https://um-support-files.ultimaker.com/materials/2.85mm/tds/PLA/Ultimaker-PLA-TDS-v5.00.pdf) |
| Tough PLA (UltiMaker) | 59 °C | 58,3 °C | — | 63,7 °C | [TDS](https://um-support-files.ultimaker.com/materials/2.85mm/tds/TOUGH-PLA/UM220509-Tough-PLA-TDS-RB-v2.10.pdf) |
| PETG (Prusament) | — | 68 °C | 68 °C | — | [TDS 2021](https://prusament.com/wp-content/uploads/2022/10/PETG_Prusament_TDS_2021_10_EN.pdf) |
| CPE co-poliéster (UltiMaker, família PETG) | 80,0 °C | 77,2 °C | — | 83,4 °C | [TDS](https://um-support-files.ultimaker.com/materials/2.85mm/tds/CPE/Ultimaker-CPE-TDS-v5.00.pdf) |
| ABS (UltiMaker) | 100,5 °C | 86,6 °C | — | 93,8 °C | [TDS](https://um-support-files.ultimaker.com/materials/2.85mm/tds/ABS/Ultimaker-ABS-TDS-v5.00.pdf) |
| PC (UltiMaker) | 107,7 °C | 104,5 °C | — | 114,7 °C | [TDS](https://um-support-files.ultimaker.com/materials/2.85mm/tds/PC/Ultimaker-PC-TDS-v5.00.pdf) |
| **PA12 SLS (EOS PA 2200)** | fusão 176 °C | **157 °C (X) / 145 °C (Z)** | 64 / 57 °C | 176 °C (B50) | [MDS EOS 2026](https://www.eos.info/polymer-solutions/polymer-materials/data-sheets/mds-pa-2200) |
| Formlabs BioMed Amber | — | 78 °C | 65 °C | — | [TDS](https://formlabs-media.formlabs.com/datasheets/2001403-TDS-ENUS-0.pdf) |
| Formlabs BioMed Clear | — | 67 °C | 54 °C | — | [TDS](https://formlabs-media.formlabs.com/datasheets/2001432-TDS-ENUS-0.pdf) |
| Formlabs Surgical Guide | — | não consta na TDS V1 (NÃO VERIFICADO) | — | — | [TDS](https://formlabs-media.formlabs.com/datasheets/1901234-TDS-ENUS-0.pdf) |
| Formlabs High Temp (engenharia, sem alegação médica) | — | 238 °C (pós-cura térmica) | 101 °C | — | [TDS](https://formlabs-media.formlabs.com/datasheets/1801087-TDS-ENUS-0P.pdf) |
| Silicone de moldagem | — | — | — | "até 200 °C" | Yuen 2022; Csámer 2023 |

Observações:
- HDT é medido **sob carga**; um molde apertado por parafusos/grampos, ou pressurizado por pistola
  (300–350 psi ≈ 2,1–2,4 MPa na patente Zimmer US9937047), está sob carga — a coluna de 1,8 MPa importa.
  PA12 cai para 57–64 °C a 1,8 MPa: **nervuras e flanges** ajudam mais que material.
- Resinas BioMed/Surgical Guide aguentam **autoclave 134 °C / 20 min** sem carga, e o grupo do Pöppe não
  viu deformação por calor do PMMA — mas em cranioplastia a placa de cimento é fina (3–5 mm), não um
  bloco de 50 mm. Extrapolação NÃO VERIFICADA.
- **PLA vai amolecer** em contato com o cimento em massa (confirmado clinicamente por Goh 2025). Isso pode
  ser característica (molde descartável, casca de 2 mm, descascar) ou defeito (distorce a geometria se o
  molde for fino e estiver sob pressão).
- PLA recozido embutido em silicone passou a resistir até 130–175 °C e à autoclave de 134 °C / 60 min,
  com variação dimensional de +0,12 a +1,32 % (Chiscop 2025, J Funct Biomater 16(9):334 —
  [PMC12471281](https://pmc.ncbi.nlm.nih.gov/articles/PMC12471281/)). Etapa extra, não testada em molde de cimento.
- EOS declara que o PA 2200 **não foi certificado como dispositivo médico** (MDR 2017/745) — a
  responsabilidade é de quem fabrica. Resinas BioMed/Surgical Guide têm ensaios ISO 10993.
- Ataque químico do **monômero MMA** sobre PLA/PETG/ABS/PC/resina impressa: **nenhum estudo encontrado**
  (NÃO VERIFICADO). PC sofre fissuração por solventes em geral; hipótese a testar em bancada.

---

## 3. Esterilização do molde impresso

| Material | Autoclave | H₂O₂ plasma / EtO | Fonte |
|---|---|---|---|
| PLA | **121 °C deforma** macroscopicamente (Rynio 2022). 134 °C com protocolo próprio de infill: deformação média 0,14 mm, máx 0,75 mm, −3,6 % volume (Ferràs-Tarragó 2022). Cilindros sólidos ≥ 5–10 mm aguentam 121 °C/20 min (Neijhoft 2023) | OK, < 0,6 mm | [Rynio 2022, PMC8998920](https://pmc.ncbi.nlm.nih.gov/articles/PMC8998920); Ferràs-Tarragó, Eur J Trauma Emerg Surg 2022;48(5):3901–3910, doi:10.1007/s00068-021-01672-6; [Neijhoft 2023, PMC9866509](https://pmc.ncbi.nlm.nih.gov/articles/PMC9866509/) |
| PLA (química) | Vapor elimina a Tg (cristalinidade 18,5 → 39,3 %) | H₂O₂ também aumenta cristalinidade; **gama** foi o menos reativo; nenhum citotóxico | [Pérez-Davila 2022, PMC9572917](https://pmc.ncbi.nlm.nih.gov/articles/PMC9572917/) |
| PETG | **121 °C deforma** | OK (< 0,6 mm) | Rynio 2022; [Fuentes 2025, PMC12609453](https://pmc.ncbi.nlm.nih.gov/articles/PMC12609453/) |
| PA12 (náilon) | **121 °C sem deformação** (Rynio 2022); SLS autoclavado em uso clínico (Chen 2022) | OK | idem |
| Resina rígida SLA | 121 °C sem deformação (Rynio); Formlabs: 134 °C/20 min ou 121 °C/30 min | EtO 55 °C/180 min; gama 29,4–31,2 kGy; E-beam 35 kGy | Fichas Formlabs |
| Silicone | Autoclave 140 °C/60 min (Kong 2021) | EtO (Nguyen 2023) | — |

Métodos usados em moldes clínicos: gás (Goh, PLA), plasma (Alaseem, resina; Tel, Grey Pro), autoclave
(Chen, náilon SLS; Pöppe, SG resin; Beitler, BioMed Amber 134 °C/20 min; Kong, silicone).

---

## 4. Desmoldante e adesão

Estudo-chave: **Beitler B, Roytman GR, Parmer G, Tommasini SM, Wiznia DH.** Evaluating surface coatings
to reduce bone cement adhesion to point of care 3D printed molds in the intraoperative setting.
3D Print Med 2022;8:28 — doi:10.1186/s41205-022-00156-6 — [PMC9373469](https://pmc.ncbi.nlm.nih.gov/articles/PMC9373469/)

- Molde: hemisfério interno **25 mm**, externo 35 mm (parede 5 mm), Form 3BL, **BioMed Amber**, camada
  0,100 mm, pós-cura 70 °C/30 min, autoclave 134 °C/20 min.
- Cimento: Simplex P com tobramicina (baixa viscosidade), cura 20 min a 22 °C; extração em Instron a 0,05 mm/s.

| Revestimento | Força de extração (N) |
|---|---|
| **Pomada de bacitracina** | **9,10 ± 6,68** (única com p < 0,05 vs controle) |
| Óleo mineral leve (imersão 5 min) | 104,93 ± 69,92 |
| Gel lubrificante | 147,76 ± 63,77 |
| Sem revestimento | 339,31 ± 305,20 |
| Gel de ultrassom | 474,11 ± 94,77 |

- Com bacitracina o cimento às vezes **caía sozinho** do molde.
- Óleo mineral **empoça** em depressões (ruim em geometria complexa).
- Revestimentos à base de água perdem eficácia (evaporam com o calor / PMMA é hidrofóbico).
- Cimento de alta viscosidade deixou **bolhas sem cimento** — usar baixa viscosidade para verter.
- Limitações: uma resina, uma orientação de impressão; lixamento da superfície não testado.
- Conferir **alergia à bacitracina**.

Outros desmoldantes publicados: óleo mineral (Klosterman "crucial"; Broughton), parafina líquida/estéril
(Zheng, Goh, Tel), óleo neutro (Pöppe), **forro de Ioban** (Goh), revestimento Altef PTFE 50 µm em
alumínio (Kohl), silicone sem desmoldante (Nguyen, Csámer). Retirar **antes da cura completa** foi
usado para evitar adesão (Zheng; Chen); outros retiram após a cura (Broughton; Pöppe). Revestir o
espaçador com sangue do paciente (PMC8469632) é para soltar do OSSO, não do molde.

---

## 5. Engenharia do molde: o que patentes e artigos especificam

### 5.1 Linha de partição e número de peças
- **Plano coronal**, metades espelhadas (Biomet US7637729B2 — silicone 80 durômetros, "Dow Q7-4780").
- Metades esquerda/direita da haste + módulos de cabeça separados (Zimmer US8801983B2 e US9937047B2,
  **HDPE**; cabeças com diâmetro interno 50, 53, 56, 59, 62, 65 mm).
- **Arthrex CeMend**: "two plastic half-molds and a stainless-steel stem with two centering pins", cimento
  de baixa viscosidade ([página Arthrex](https://www.arthrex.com/resources/AN1-000644-en-US/cemend-spacer-molds-with-arthrex-bone-cement-for-two-stage-revision)).
  Tamanhos AR-902-0842M, 1042M, 1048M, 1448M (8-42, 10-42, 10-48, 14-48 mm). Significado exato dos
  números (haste/cabeça) e material das metades: **NÃO VERIFICADO**.
- Heraeus US10399248B2: 4 peças plásticas descartáveis, **sem porta de enchimento** (cavidades abertas,
  espátula ou cartucho), sem grampos; cabeça 46–75 mm; superfícies inclinadas **1°–60° (preferência
  1°–20°)** para o excesso escorrer.
- Linha **não plana** quando a anatomia exige (Broughton, tálus). Molde "tipo livro" com corte lateral
  (Csámer, silicone).

### 5.2 Registro (alinhamento das metades)
- Lingueta arredondada e ranhura em todo o contorno, colada com adesivo de silicone (Biomet).
- Pinos e furos nos módulos de cabeça; ranhuras simétricas na haste (Zimmer).
- Encaixe anel/tampa (Pöppe); "alignment posts" (cranioplastias).
- Folga de encaixe em impressão: SLA 0,2 mm (peças pequenas) a 0,4 mm (grandes); SLS 0,2 mm (< 20 mm²)
  e 0,4 mm (> 20 mm²); FDM precisa de folga maior que SLA/SLS ([Formlabs, tolerâncias](https://formlabs.com/blog/3D-printing-tolerances-for-engineering-fit/), [interlocking](https://formlabs.com/blog/how-to-3d-print-interlocking-joints/)).
  Geradores abertos usam 0,15 mm (mold-maker, FDM "tight fit") e 0,2 mm (moldmaker MIT).

### 5.3 Fechamento
- 15 fixadores ao longo das abas (Zimmer); 2 parafusos (Kohl, alumínio); parafusos com chave 3,5 mm
  (Aequalis, Klosterman); grampo externo para pressurizar (Broughton); "clasped together" (Goh);
  parafuso M4/M5 com porca sextavada embutida (moldmaker MIT).

### 5.4 Porta de enchimento (sprue)
- **Em área não articular**, dimensionada para o bico de seringa de **60 mL**; com 2 portas, **paralelas**
  para facilitar a desmoldagem (Broughton).
- Porta rosqueada para bico de pistola + **tampão rosqueado** após retirar o cartucho (Zimmer); injeção a
  ~300–350 psi (US9937047B2).
- Porta de acesso na cabeça para bico de dispensador (Biomet); 2 canais no topo para tubo de 20 mL (Kohl).
- Sem porta: cavidade aberta (Heraeus). Pistola de cimento é opcional.
- Geradores hobby: sprue cônico 10 mm no topo, afunilando 2:1 até a cavidade (mold-maker).

### 5.5 Respiros
- "Sized to allow passage of air but to restrict or block passage of bone cement"; na linha central
  **oposta à porta**, ou 15°–30° fora dela (Biomet). Diâmetro não informado (NÃO VERIFICADO).
- Frestas entre as abas funcionam como respiro; respiros na cabeça e na ponta distal com **confirmação
  visual** quando o cimento aparece (Zimmer).
- "Injected until cement overflowed all ports" = molde cheio (Broughton); segunda porta como linha de vácuo.
- Canais de extravasamento do excesso (Tel, Grey Pro).
- Geradores hobby: 2–4 respiros nos extremos da cavidade, raio 0,35× o do gate (mold-maker).

### 5.6 Espessura de parede publicada
| Parede | Material | Fonte |
|---|---|---|
| 2 mm | PLA (casca descascável) | Goh 2025 |
| 3 mm | Náilon SLS | Chen 2022 |
| 5 mm | Resina SG / BioMed Amber | Pöppe 2022; Beitler 2022 |
| ≥ 12 mm | Silicone 40 Shore A | Csámer 2023 |
| 10 / 15 mm / 8 % da caixa | Geradores genéricos | STL_Mold_Maker; moldmaker; mold-maker |

### 5.7 Reforço metálico e o molde
- Barra de reforço de CoCr fundido (ou inox cortado a laser) com **projeções de centragem** que tocam a
  parede da cavidade (Zimmer US8801983B2); núcleo metálico modular haste+colo+disco na cabeça (US9937047B2);
  haste de inox com 2 pinos de centragem (CeMend); núcleo/vara de reforço (Biomet).
- Ombro: guia 2,5 mm com ponta em bola (Klosterman); haste de Rush (Adan 2026,
  [PMC13332471](https://pmc.ncbi.nlm.nih.gov/articles/PMC13332471/)); Steinmann rosqueado + haste
  intramedular (Frankenspacer, [PMC12573618](https://pmc.ncbi.nlm.nih.gov/articles/PMC12573618/)).
- Lunz A et al. BMC Musculoskelet Disord 2022;23:945 ([PMC9617327](https://pmc.ncbi.nlm.nih.gov/articles/PMC9617327/)):
  após 6 semanas **nenhuma** combinação passou de 50 MPa em flexão; 4 g de vancomicina < 2 g; recomendam
  **endoesqueleto**.

### 5.8 Contração e precisão
- PMMA: 3–5 % em volume (Charnley) até 5–7 % com mistura a vácuo; Gilbert: Simplex P 6,67 % (vácuo)
  × 5,09 % (manual); no diâmetro de um manto acetabular: 0,60 mm (1,15 %) vácuo × 0,39 mm (0,75 %) manual
  (Boote 2020, Proc IMechE H 235(2):133–140 — [PMC7841715](https://pmc.ncbi.nlm.nih.gov/articles/PMC7841715)).
- Precisão relatada: 100 µm (CoCr SLM, Broughton), submilimétrica (Grey Pro, Tel), 1 mm (silicone iraniano),
  PLA/PETG impressos RMS 0,093 mm antes da esterilização (genioplastia, H₂O₂ submilimétrico).
- Versões **105 % e 95 %** do volume para ajuste intraoperatório (Broughton).

---

## 6. Problemas relatados

| Problema | Onde | Mitigação publicada |
|---|---|---|
| Cimento gruda no molde | Beitler (339 N sem revestimento); Klosterman (precisa de impactor) | Bacitracina; óleo mineral; parafina; retirar antes da cura total |
| Molde plástico amolece com o calor | Goh (PLA) — usado a favor | Material com HDT maior (PA12) ou molde descartável fino |
| Bolhas / vazios | Beitler (alta viscosidade) | Cimento de baixa viscosidade; mistura a vácuo; respiros; encher até transbordar |
| Óleo empoça em depressões | Beitler | Camada fina; pomada em vez de óleo |
| Deformação na autoclave | PLA/PETG a 121 °C (Rynio) | H₂O₂ plasma, EtO, ou PA12/resina |
| Fratura do espaçador | Ke 2024: 1/14 revisões por fratura; Lunz 2022 | Endoesqueleto; não exagerar antibiótico |
| Instabilidade | Ke 2024: 2/14 subluxações; Frankenspacer 56 % luxação e 83 % erosão glenoidal (cabeças 40/45/50 mm) | Fora do escopo do molde; afeta a escolha do diâmetro da cabeça |
| Ajuste impreciso | 1 caso de cranioplastia revisado (PMC9282781) | Versões ±; verificação no modelo impresso |

---

## 7. Projetos abertos e ferramentas

| Projeto | Licença | O que faz | Parâmetros padrão |
|---|---|---|---|
| [matta174/mold-maker](https://github.com/matta174/mold-maker) (web, TypeScript, Three.js + **Manifold WASM**) | **PolyForm Noncommercial 1.0.0** — uso comercial exige licença separada | Carrega STL, plano de partição X/Y/Z (e oblíquo), pinos de registro, sprue e respiros automáticos, mapa de draft | parede 8 % da maior dimensão; folga **0,15 mm**; sprue 10 mm (2:1); pino raio 0,3× parede, altura 0,6× parede; 2–4 respiros; limites de draft 0,2 / 0,0 |
| [juppeee/moldmaker](https://github.com/juppeee/moldmaker) (Python trimesh + manifold3d, GUI Three.js) | **MIT** | Molde de 2 partes, sprue na linha de partição, cavilhas, parafusos com porca embutida, auto-reparo de STL | parede 15 mm; sprue 10 mm; cavilha Ø5 × 6 mm; folga **0,2 mm**; M4/M5 |
| [mbparks/STL_Mold_Maker](https://github.com/mbparks/STL_Mold_Maker) | GPL-3.0 | Negativo em 2 partes com chaves e bico de vazamento | parede 10 mm |
| [BM804/automatic_mold_maker_version_one](https://github.com/BM804/automatic_mold_maker_version_one) | sem licença declarada | STL → molde 2 partes com alinhamento | — |

Busca por STL público de molde de espaçador de cimento (NIH 3D, Thingiverse, GitHub): **nada encontrado**.
Nenhum desses geradores foi validado para uso cirúrgico.

---

## 8. Implicações para o gerador paramétrico (propostas — decisão do cirurgião)

1. **Material-alvo no centro cirúrgico**: PA12 SLS (autoclave; HDT 145–157 °C a 0,45 MPa) ou resina
   biocompatível autoclavável (BioMed Amber / Surgical Guide). PLA/PETG só para ensaio em bancada ou com
   H₂O₂/EtO **aceitando amolecimento**. O gerador deve ter um seletor "processo" (FDM / SLA / SLS) que
   ajusta folgas e parede.
2. **Parede**: padrão ≥ 3 mm (SLS) / ≥ 5 mm (SLA), com **abas de fechamento** e nervuras; PLA 2 mm só em
   modo "descartável descascável". Valores publicados, não validados para bloco de 50 mm.
3. **Plano de partição** = plano de simetria que contém o eixo da haste e o eixo do colo (metades
   anterior/posterior). Sem retenções: esfera, colo e haste saem sem draft. A **rebarba cruza a cabeça**
   articular → prever acabamento, ou oferecer a cabeça como módulo separado (como Zimmer/Heraeus).
4. **Registro**: dois cilindros (um macho, um fêmea) como pedido; folga 0,15–0,2 mm FDM, 0,2–0,4 mm
   SLA/SLS; chanfro na ponta; considerar lingueta/ranhura na borda como vedação (Biomet).
5. **Porta de enchimento** na ponta distal do corpo (área não articular, onde entra o dreno/haste
   distal), no diâmetro do bico de seringa de 60 mL ou da pistola. **Respiros** no ponto mais alto da
   cabeça durante o enchimento e nos cantos colo-corpo; cimento saindo pelo respiro = cheio.
6. **Canal para o núcleo metálico** (guia 2,5 mm / Steinmann / Rush) saindo pela porta distal, com
   **ressaltos de centragem** na cavidade (como CeMend e Zimmer).
7. **Fechamento**: furos para parafusos passantes nas abas (Klosterman usa parafusos; moldmaker M4/M5) ou
   grampos. Se houver pressurização por pistola, dimensionar para carga (HDT a 1,8 MPa).
8. **Compensação de contração** opcional de 0–1 % no diâmetro e saída de variantes **95 / 100 / 105 %**.
9. **Aviso térmico na interface**: cabeça ≥ 45 mm e corpo espesso → núcleo > 100 °C esperado; PLA amolece.
10. **Instruções de uso na página**: desmoldante (bacitracina > óleo mineral > parafina; evitar gel à base
    de água), cimento de baixa viscosidade, retirar do molde no tempo definido, conferir alergia.
11. **Acabamento da cavidade da cabeça**: camadas finas (SLA 50–100 µm) e orientação que ponha as marcas
    de camada fora da superfície articular; impacto do lixamento não estudado.
12. **Licença**: não reaproveitar código do mold-maker (PolyForm NC). Ideias e parâmetros públicos, ou
    código MIT (juppeee/moldmaker), podem inspirar; a CSG com manifold-3d já existe no repo (PSI).

---

## 9. Perguntas em aberto

- Temperatura da **parede** do molde (PA12, resina, PLA) durante a cura de uma cabeça de 45–55 mm —
  medir com termopar em bancada antes do uso clínico.
- O monômero MMA ataca PLA/PETG/resina/PC impressos? Nenhum estudo encontrado.
- Qual esterilização o hospital oferece (autoclave 134 °C, Sterrad/H₂O₂, EtO)? Define o material.
- Impressão própria (FDM/SLA) ou serviço SLS? Define folgas e parede.
- Pomada de bacitracina estéril disponível no Brasil para uso em campo? (NÃO VERIFICADO)
- Situação regulatória (ANVISA) de molde feito no hospital para cimento que vai ao paciente.
- Material do molde do Ke 2024 (úmero proximal), do Zhang 2024 (quadril) e do Gemalmaz 2018: texto
  completo não lido.
- Significado dos códigos e material das metades do Arthrex CeMend; detalhes do StageOne de ombro.
- Diâmetro de respiro que deixa passar ar e segura cimento de baixa viscosidade: nenhum número publicado.

---

## 10. Referências (URLs)

1. Goh BHE et al. Rev Bras Ortop 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12213075/
2. Chen J et al. JSES Rev Rep Tech 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10426601/
3. Zheng K et al. Orthop Surg 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10549869/
4. Kong L et al. BioMed Res Int 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7884112/
5. Zhang H et al. Int J Antimicrob Agents 2024 — https://www.sciencedirect.com/science/article/pii/S0924857923003692
6. Broughton KK et al. 3D Print Med 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8447608/
7. Alaseem A et al. Curr Oncol 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12384866/
8. Exner GU et al. JBJS Case Connect 2021 — https://pubmed.ncbi.nlm.nih.gov/34019491/
9. Qu GX et al. Eur Rev Med Pharmacol Sci 2023 — https://pubmed.ncbi.nlm.nih.gov/37667927
10. Ke S et al. Surg Innov 2024 — https://pubmed.ncbi.nlm.nih.gov/38606504
11. Gemalmaz HC et al. Gazi Med J 2018 — https://medicaljournal.gazi.edu.tr/index.php/GMJ/article/view/1685
12. Ocampo MGC et al. J Southeast Asian Orthop 2026 — https://www.jseaortho.org/index.php/jsao/article/view/323
13. Klosterman EL et al. Arthrosc Tech 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/
14. Kohl S et al. Acta Orthop 2009 — https://pmc.ncbi.nlm.nih.gov/articles/PMC2823218/
15. Nguyen QTQ et al. SICOT-J 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10644890/
16. Yuen JC et al. Cureus 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9815779/
17. Molde de silicone de joelho (Irã) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11756536
18. Pöppe JP et al. Acta Neurochir 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8913485/
19. Formlabs, roundup de moldes de PMMA (Tel 2020/2021, Morales-Gómez 2019) — https://formlabs.com/blog/roundup-pmma-molds/
20. Csámer L et al. Sci Rep 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10368708/
21. Cranioplastia LMIC — https://pmc.ncbi.nlm.nih.gov/articles/PMC9282781/
22. Lannon M et al. Can J Neurol Sci 2022 — https://www.cambridge.org/core/journals/canadian-journal-of-neurological-sciences/article/costeffective-cranioplasty-utilizing-3d-printed-molds-a-canadian-singlecenter-experience/6AB8044FFF888A6CCA1DE244A206F688
23. Beitler B et al. 3D Print Med 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9373469/
24. Carli AV et al. J Arthroplasty 2018 — https://www.arthroplastyjournal.org/article/S0883-5403(18)30072-X/abstract
25. Hoyt AK et al. J Bone Jt Infect 2023 — https://jbji.copernicus.org/articles/8/175/2023/
26. Li B et al. Orthop Surg 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10235157/
27. Li C et al. J Mater Sci Mater Med 2004 — https://pubmed.ncbi.nlm.nih.gov/15338595/
28. Lunz A et al. BMC Musculoskelet Disord 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9617327/
29. Boote AT et al. Proc IMechE H 2020 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7841715
30. Rynio P et al. Int J Mol Sci 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8998920
31. Ferràs-Tarragó J et al. Eur J Trauma Emerg Surg 2022 — https://link.springer.com/article/10.1007/s00068-021-01672-6
32. Neijhoft J et al. Polymers 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9866509/
33. Pérez-Davila S et al. Polymers 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9572917/
34. Fuentes JM et al. Polymers 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12609453/
35. Chiscop F et al. J Funct Biomater 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12471281/
36. Adan FO et al. JSES Rev Rep Tech 2026 — https://pmc.ncbi.nlm.nih.gov/articles/PMC13332471/
37. Frankenspacer — https://pmc.ncbi.nlm.nih.gov/articles/PMC12573618/
38. Patente Biomet US7637729B2 — https://patents.google.com/patent/US7637729B2/en
39. Patente Zimmer US8801983B2 — https://patents.google.com/patent/US8801983B2/en
40. Patente Zimmer US9937047B2 — https://patents.google.com/patent/US9937047B2/en
41. Patente Heraeus US10399248B2 — https://patents.google.com/patent/US10399248B2/en
42. Patente Cedars-Sinai US12551347B2 — https://patents.google.com/patent/US12551347B2/en
43. Arthrex CeMend — https://www.arthrex.com/resources/AN1-000644-en-US/cemend-spacer-molds-with-arthrex-bone-cement-for-two-stage-revision
44. Fichas técnicas: UltiMaker PLA/Tough PLA/CPE/ABS/PC; Prusament PETG; EOS PA 2200; Formlabs BioMed Amber, BioMed Clear, Surgical Guide, High Temp (URLs na tabela 2.2)
45. Formlabs, tolerâncias — https://formlabs.com/blog/3D-printing-tolerances-for-engineering-fit/
46. mold-maker — https://github.com/matta174/mold-maker · moldmaker (MIT) — https://github.com/juppeee/moldmaker · STL_Mold_Maker — https://github.com/mbparks/STL_Mold_Maker
