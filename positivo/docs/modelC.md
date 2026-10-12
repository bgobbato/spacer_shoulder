# Modelo C — "Cogumelo com aleta" (positivo proximal + acoplamento de dreno)

Código: `src/models/modelC.mjs`. Build: `node build.mjs --model C --head 44,48,52`.
Saídas: `stl/C_h{44,48,52}.stl|.json`, `render/C_h*_*.png`, `render/compare_*.png`.
Variantes: `variants/C_tubeFr24|32|34/` e `variants/C_sutureHoles0/` (todas com cabeça de 48).
`variants/C_tubeFr36/` é de antes da correção de 26/set e está **obsoleta** (36 Fr saiu da faixa).

## O que é

É um espaçador umeral de cimento com o arquétipo Subiton/Biofix. Tem uma cúpula em cogumelo
(calota esférica polida, borda grossa arredondada) sobre um colo cônico curto. Uma **aleta
lateral** com 3 furos de sutura sai da haste proximal e sobe até embaixo da borda lateral da
cúpula. As tuberosidades ficam no paciente.

**Decisão do cirurgião (26/set/2026):** a haste distal longa das fotos passa a ser um **dreno de
tórax cheio de cimento** (técnica Klosterman, PMC7917196). A impressora é uma Bambu Lab A1 mini
(180 × 180 × 180 mm). Por isso o positivo é **só a parte proximal**: cabeça, colo, corpo, aleta e
um segmento curto de haste. Esse segmento termina no **acoplamento do dreno**:

| z (mm) | o quê |
|---|---|
| 0 … `couplingLen` (15) | cilindro de Ø = DE do dreno (Fr/3; 28 Fr = 9,33 mm), coaxial com a haste. É o **espaço da ponta do dreno**, não cimento moldado. No molde vira um canal coaxial que segura o dreno. |
| `couplingLen` | **plano de batente**: a ponta do dreno para aqui e o cimento vazado fecha sobre ela |
| logo acima | alargamento cônico de 30° em relação ao eixo, do DE do dreno até a haste de 11,5 mm (≈ 1,9 mm de altura) |
| até o colo | haste proximal de 11,5 → 12 mm (cabe no canal fresado a `reamerD` = 12 mm) |

**Fio-guia contínuo** (Ø 3,2 mm por padrão): corre dentro do dreno e da parte proximal. O sólido
fica **cheio**, sem furo para o fio. `meta.coreWire.polyline` dá o trajeto:
`[0,0,0] → S = [0,0,zS]` (origem do colo no eixo) `→` na direção do centro da cabeça. O fio para
onde deixaria de ter 4 mm de cimento em volta. Com 48 mm: `[[0, 0, 0], [0, 0, 62], [7.58, 0, 92.32]]`.
É uma dobra de 14°, que passa do centro da cabeça. O fio reto no eixo sairia do colo para dentro
da aleta de 8 mm e ficaria com só 2,4 mm de cobertura. Por isso o trajeto é dobrado.

**Cobertura do fio — onde a regra de 4 mm NÃO vale (medido):** no batente (z = 15) o cimento
vazado começa com o raio do dreno, então a cobertura ali é DE/2 − 1,6: **3,07 mm a 28 Fr**
(2,40 a 24 Fr, 3,73 a 32 Fr, 4,07 a 34 Fr). No alargamento e no joelho sobe até 3,46 mm; a regra
de 4 mm vale **de z ≈ 18,2 mm para cima** (28 Fr). É a junção dreno flexível/cimento rígido, onde a
flexão é máxima. Opções, se o cirurgião quiser os 4 mm também no batente: fio de 2,5 mm (3,42 mm
a 28 Fr) ou dreno de 32–34 Fr. `meta.coreWire.coverAtBatenteMm`, `minCoverInFlareMm`,
`coverRuleHoldsFromZ` e `coverNote` registram isso em cada build.

### Por que um alargamento de 30° e não um degrau plano de 90°
O ângulo reto na raiz (entre o cilindro do dreno e um ressalto plano) é um vinco côncavo. O
validador exige filete ≥ 2 mm nesses vincos, com razão, porque vinco trinca PMMA. Mas um filete
de 2 mm ali deixaria uma **lâmina fina de cimento abraçando a ponta do dreno**, e lâmina fina
lasca. Com 30° a raiz vira 30° (abaixo do limite de 35°) e a aresta de cimento no batente fica
com 120° de ângulo interno, robusta. O batente continua plano: é a face do cimento sobre a ponta
do dreno (plano z = 15).

## Qual foto segue e como

- `images (2).jpeg` (desenho de linha com régua de 15 cm): dá as **proporções**, medidas em pixel
  nos dois desenhos (frontal e lateral). Escala: comprimento total do desenho = 163 px ≙ 150 mm
  (0,92 mm/px).
- `subiton-espaciador_hombro_n.jpg` e `images.jpeg`: dão o **aspecto**. A aleta com 3 furos fica
  no lado lateral, oposto à inclinação da cabeça, logo abaixo da borda da cúpula. A borda inferior
  da aleta desce afinando para dentro da haste. A borda da cúpula é grossa e arredondada.
- Nenhuma dimensão do produto foi copiada. Só o arquétipo e as proporções.

### Proporções medidas (pixels no desenho de `images (2).jpeg`)

| medida | px | razão | em 150 mm | usado |
|---|---|---|---|---|
| diâmetro da cúpula (vista de frente) | 52 | D/L = 0,32 | 47,9 mm | D padrão 48 |
| haste sob o colo | 13 | 0,080·L | 12 mm | 12 mm (= `reamerD`; era 14 até 26/set) |
| haste distal | 9–10 | 0,058·L | 8,3–9 mm | → vira o dreno (24 Fr = 8 mm … 34 Fr = 11,3 mm) |
| aleta além da borda lateral da haste | 7 | 0,043·L | 6,4 mm | 8,75 mm (5 mm de cimento em volta do furo, mais a borda) |
| espaçamento dos furos | 7 | — | 6,4 mm | 9 mm (6,5 mm de cimento entre os furos; 8 mm dava 5,5 — abaixo da regra de 6) |
| face plana da cabeça em relação à horizontal | — | — | ≈ 39° | NSA 135° (β = 45°) |
| início do alargamento medial do colo acima da ponta | 98 | 0,60·L | 90 mm | colo começa 1·R abaixo do centro da cabeça |

## Parâmetros

| nome | unidade | padrão | faixa | o quê |
|---|---|---|---|---|
| headD | mm | 48 (gerar 44/48/52) | 40–58 | diâmetro da esfera da cabeça |
| headHD | — | 0,45 | 0,37–0,63 | altura da calota / D |
| rimFillet | mm | 4 | 2–6 | borda grossa arredondada (toro) |
| nsDeg | ° | 135 | 125–140 | ângulo colo-diáfise |
| headOffset | mm | 6 | 0–10 | centro da cabeça medial ao eixo (+X) |
| proxLen | mm | 110 | 90–140 | comprimento do positivo (z = 0 até o topo da cúpula) |
| stemTopD | mm | 12 | 10–18 | haste sob o colo (≥ stemBotD) |
| stemBotD | mm | 11,5 | 10–18 | haste acima do alargamento (≥ DE do dreno + tubeClear) |
| tubeClear | mm | 2 | 2–4 | folga do alargamento: haste ≥ DE + tubeClear (1 mm por lado) |
| reamerD | mm | 12 | 8–18 | Ø do canal fresado; haste maior → aviso (estilo V7 do SPEC) |
| tubeFr | Fr | 28 | 24–34 (oferecer 24/28/32/34) | dreno; DE = Fr/3 mm. Teto 34 = mesmo da lib do molde |
| couplingLen | mm | 15 | 8–25 | comprimento do cilindro do dreno; batente no topo |
| shoulderDeg | ° | 30 | 15–35 | alargamento em relação ao eixo |
| rootFillet | mm | 1 | 0,5–2 | arredondamento mínimo na raiz do alargamento |
| coreWireD | mm | 3,2 | 2–4 | fio-guia (não é subtraído) |
| coreCover | mm | 4 | 3–8 | cimento radial mínimo em volta do fio; define o fim do fio |
| neckDropR | ×R | 1,0 | 0,6–1,4 | origem do colo no eixo, abaixo do centro da cabeça |
| neckFrac | ×R | 0,40 | 0,3–0,5 | raio do colo na base da cabeça |
| finT | mm | 8 | 8–14 | espessura da aleta em Y |
| finEdgeR | mm | 3,8 | 3–5 | arredondamento das bordas da aleta (quase meia-cana) |
| finTopDrop | mm | 1,5 | 0–6 | topo da aleta abaixo do extremo lateral da cabeça |
| finTaper | mm | 14 | 0–25 | borda inferior da aleta descendo pela haste |
| sutureHoles | — | 3 | 0 ou 3 | furos de sutura passantes em Y |
| holeD | mm | 2,5 | 2–3,5 | Ø do furo |
| holeEdge | mm | 6,25 | 6–10 | cimento do furo até a borda livre |
| holeSpacing | mm | 9 | 8–12 | distância entre centros; o build recusa se holeSpacing − holeD < 6 |
| fillet / neckFillet / headFillet | mm | 3 / 5 / 4 | 2–6 / 2–10 / 2–8 | concordâncias (smin) |
| proxyInset | mm | 0,3 | 0,1–0,6 | margem do proxy da cabeça (técnico) |
| edge | mm | 0,6 | 0,4–0,7 | aresta da malha do levelSet (técnico) |

## Validação (build final, padrões, 26/set/2026 — após a revisão adversarial)

Todas passam: 1 componente, genus = furos, 0 falhas de desmoldagem em Y, simetria ≤ 0,03 mm,
0 mm de vinco côncavo, nenhum aviso.

| cabeça | vol (cm³) | PMMA (g) | pacotes 40 g | demold | genus | espessura min / p1 (mm) | desvio da esfera (mm) | simetria (mm) | ligamento furo→borda / entre furos (mm) |
|---|---|---|---|---|---|---|---|---|---|
| 44 | 32,31 | 38,1 | 1 | 0/18920 | 3/3 | 6,26 / 6,60 | 0,0094 | 0,008 | 6,26 / 6,52 |
| 48 | 38,29 | 45,2 | 2 | 0/19800 | 3/3 | 6,26 / 7,66 | 0,0094 | 0,028 | 6,26 / 6,52 |
| 52 | 45,60 | 53,8 | 2 | 0/21120 | 3/3 | 6,26 / 6,69 | 0,0093 | 0,012 | 6,26 / 6,52 |

**Ligamentos dos furos (checagem própria do modelo).** O validador genérico pula as amostras de
espessura a < r + 2 mm de cada furo e atira os raios em Y (lê a aleta de 8 mm), então **não mede**
o cimento entre furos. Por isso o modelo mede sozinho, no plano y = 0: de cada furo, 72 direções
no plano XZ até sair do sólido (borda) ou entrar em outro furo (ponte). O build **recusa** se
qualquer ligamento < 6 mm, e recusa antes de malhar se `holeSpacing − holeD < 6` ou `holeEdge < 6`
(teste: `--set holeSpacing=8` → erro "5.50 mm < 6"). Conferido também na malha STL com raio
vertical em x = −7,5, y = 0 (cabeça 48): paredes dos furos em z = 75,67 / 78,17 / 84,67 / 87,17 /
93,67 / 96,17 → pontes de **6,50 mm**; raio lateral: 6,25 mm até a borda. Resultado em
`meta.dims.holeLigamentsMeasured`.

**Canal (`meta.canal`).** Haste nominal Ø 12 = `reamerD` 12 → sem aviso. Medido na malha: a seção
inteira (AP e ML) cabe em 12 mm da ponta até z ≈ 55 (≈ 40 mm abaixo do corte no eixo); acima disso
a aleta e a concordância do colo alargam o corpo (parte metafisária). Com 32 Fr a haste vai a
12,67 mm e com 34 Fr a 13,33 mm: o build avisa ("ream the canal to ≥ … or use a smaller tube").
Para canal estreito, **24 Fr (DE 8 mm)**.

Variantes (cabeça 48), todas OK: 24 Fr 37,96 cm³ / 44,8 g · 32 Fr 39,65 / 46,8 g (aviso de canal) ·
34 Fr 40,66 / 48,0 g (aviso de canal; precisou refazer a malha 1×, grade 0,57) · sem furos 38,41 /
45,3 g (espessura mín. 8,0). 36 Fr agora é recusado (fora da faixa).

Varredura depois da correção: 14 builds, todos OK — cabeças 40 e 58 × `holeSpacing` 8,5 e 12,
`holeEdge` 6 (espessura mín. 6,00), NSA 125 e 140, `proxLen` 90, `headHD` 0,63.

**Massa de PMMA:** 1,18 g/cm³ (premissa do validador). Os pacotes contam 40 g de pó = 40 g de
cimento curado, sem sobra. Na prática, pedir **2 pacotes** para 44–52 e **3** para 58 com
calota alta. O cimento de dentro do dreno **não está incluído**: 28 Fr com DI ≈ 6,5 mm dá
≈ 0,33 g por cm de dreno.

**Impressora:** o molde precisa de ≥ 10 mm de parede. O maior positivo possível (58 mm,
`proxLen` 140) cabe em 140 + 20 = 160 mm ≤ 180. O padrão (110 mm) dá cavidade + parede ≈ 66 × 66 × 130 mm.

## Limites conhecidos

- **Canal do dreno no molde — DECISÃO DO CIRURGIÃO PENDENTE.** O `moldapp` (congelado) faz
  bloco = caixa do positivo + margem (6 mm) em **todos** os lados. Nenhuma peça do positivo alcança
  o lado de fora, então z = 0…15 vira um **bolso cego** Ø DE do dreno atrás de uma parede de 6 mm.
  Um "toco" de dreno abaixo de z = 0 não resolve (a caixa cresce junto). Opções
  (`meta.tube.moldChannel`):
  A. depois de imprimir, furar a parede distal coaxial ao bolso (Ø DE + 0,3), ou no Bambu Studio
     pôr um cilindro "negative part" Ø DE + 0,3 nesse eixo antes de fatiar (mais simples);
  B. `spacer/lib/src/mold.js` `buildMold()` já corta `tubeHole` Ø(DE + 0,3) em x = y = 0 ao longo de
     +Z pela parede do fundo — mesmo eixo deste positivo;
  C. o Claude (não o OpenCode) acrescenta um `tubeHole` opcional ao `moldapp`.
  O batente continua sem degrau no molde (acima do canal a cavidade alarga): marcar 15 mm de
  inserção no dreno.
- **Canal de enchimento do `moldapp`:** fica no centro da caixa em X e Z. Neste positivo o centro
  cai em (x, z) ≈ (7,5; 55) com cabeça 48, 1,6 mm ao lado medial da haste, sob a cabeça. O canal
  Ø 10 entra 3,5 mm (44: 4,25; 52: 3,25) no contorno da haste: abre na cavidade **de lado**, na
  haste, e deixa um toco de cimento ali para aparar (`meta.moldapp`). Encher pela lateral da haste
  funciona, mas não é o ideal (ar preso na cabeça); melhor encher pela cabeça (opção B/C acima).
- **DI do dreno** varia com a marca e não entra no modelo. Só o DE importa para o acoplamento.
- **Fio-guia** só é informado (`meta.coreWire`). O sólido não tem canal para ele. Quem posiciona o
  fio é o molde/cirurgião.
- **Malha:** o levelSet deixa ondulações de ~0,01 mm em concordâncias em sela quase paralelas a
  Y. Cerca de 1 raio em 20 000 lia isso como contrassaída. O modelo projeta os vértices na
  superfície exata e, se a checagem rápida de desmoldagem ainda acusar, refaz a malha com a grade
  1,05·/0,95· e fica com a primeira limpa. `meta.meshing.levelSetTries` registra as tentativas
  (os padrões passam na 1ª). Um build que precisa refazer a malha leva ~25 s em vez de ~11 s.
- `proxLen` < ~86 mm com cabeça de 58 mm não deixa haste entre o alargamento e o colo. O build
  recusa com mensagem.
- `headOffset`, `neckDropR` e as proporções da aleta vêm do desenho. Nenhuma foi validada contra
  TC de canal real. **Mudança de 26/set:** a haste proximal caiu de 14/13 mm para 12/11,5 mm para
  caber em `reamerD` = 12 (a pesquisa mediu canal diafisário de 11,1–14,5 mm entre −60 e −120 mm).
  Para voltar ao visual anterior: `--set stemTopD=14,stemBotD=13` (gera aviso de canal com
  `reamerD` 12). O corpo acima de z ≈ 55 é mais largo que 12 mm por desenho (metáfise).
