# Modelo A — "Colher" (parte proximal + acoplamento do dreno de tórax)

Código: `src/models/modelA.mjs` · build: `node build.mjs --model A --head 44,48,52`
Saídas: `stl/A_h44|48|52.stl` (+ `.json` com parâmetros, meta e relatório), `render/A_h*_*.png`,
variantes em `variants/<nome>/`.

## O que é

Positivo (sólido fechado) de um espaçador umeral de cimento no arquétipo "colher" dos
espaçadores pré-moldados tipo Tecres: cabeça em calota lisa, com a borda lateral quase no
alinhamento da face lateral da haste e a cúpula pendendo para medial; uma **alma triangular
curta e grossa** (neck web) sobe da face medial da haste até a face inferior da calota; haste
reta e redonda com um **sulco longitudinal raso** em cada face ±Y (anterior/posterior), para
travar rotação.

**Decisão do cirurgião (26/set/2026):** a haste distal é um **dreno de tórax** cheio de
cimento (técnica Klosterman 2021, PMC7917196). A impressora é uma Bambu Lab A1 mini (cubo de
180 mm). Por isso o positivo é **só a parte proximal**: cabeça + alma + um trecho curto de haste,
que termina embaixo num **acoplamento para o dreno**:

| Zona (z em mm) | Forma | Função |
|---|---|---|
| 0 → `couplingLen` (15) | cilindro Ø = OD do dreno (Fr/3) | **assento do dreno**: no molde vira um furo que segura o dreno coaxial com a haste. O dreno ocupa esse volume (não é cimento desta peça). |
| em `couplingLen` | **batente cônico 50°** (borda com raio 0,6 mm) | o molde passa `stopOverlap` (0,65 mm por lado) por cima da parede do dreno: o dreno para ali e fica centrado. |
| logo acima | cintura côncava (raio 2,18 mm, sem entalhe), Ø = OD − 1,3 = **8,03 mm** em 28 Fr | o cimento do lúmen do dreno se une ao cimento da peça por aqui (junção monolítica). |
| até ~22,5 | alargamento 20° + arco convexo 4 mm | volta ao Ø da haste moldada (11 mm). |
| 22,5 → raiz da alma | haste reta Ø 11 com sulcos ±Y | trecho moldado que fica na metáfise. |

Um **fio-guia contínuo** (Ø 3,2 mm por padrão) corre no eixo da haste, do fim do dreno até
8 mm abaixo da cúpula. O sólido continua **cheio** (o fio só vai no `meta.coreWire`; o sistema de
molde decide se abre canal para ele).

### Molde: o app de molde está congelado (27/set/2026)

O sistema de molde (`spacer/moldapp`, feito no OpenCode) **não será mais atualizado**. Ele faz
só isto: centra o STL no bbox, bloco = bbox + margem (6 mm), plano y = 0, pinos, **um sprue Ø 10
ao longo de Y no centro (x, z) do bbox** e **um respiro Ø 3 ao longo de X, no plano de partição,
na mesma altura z**. Não abre mais nada. O positivo foi adaptado a isso:

1. **Sprue (automático, resolvido no positivo).** O centro do bbox cai ~9–12 mm medial ao eixo,
   em z = 45 (metade do comprimento), onde antes quase não havia peça: o sprue tocava a peça em
   16 % do disco (h44), 3,4 % (h48) e **0 %** (h52) — medido rodando o `generateMold` do app nos
   STLs antigos. Agora o modelo calcula esse ponto antes de gerar a malha e, se a peça não tiver
   ≥ 8 mm de espessura (Y) sob o disco inteiro do sprue, põe ali uma **almofada de alimentação**
   (estádio em XZ do meio da haste até o centro do sprue, dilatado por esfera de 5 mm → 10 mm em
   Y, borda toda redonda, filete 5 mm). Resultado: **100 % do disco do sprue sobre a peça, espessura
   mínima 8,65 mm sob ele** nas três cabeças. Quando a almofada fica a < 4,5 mm da cabeça (NSA baixo
   com cabeça grande), ela é estendida até o ponto de contato da alma e o filete sobe para 8 mm —
   uma almofada separada ali deixava um túnel (gênero 1) entre almofada, alma e borda medial.
   A almofada não passa do bbox (checado: centro do bbox real = previsto ± 0,02 mm).
2. **Furo do dreno (MANUAL).** O assento do dreno chega em z = 0, mas o app fecha com a parede
   de 6 mm. Com as metades presas, furar **Ø 10 mm (28 Fr; `meta.moldPrep.tubeHole.drillD`)
   na face distal do bloco, na costura, a 14,0 mm da face lateral** (todas as cabeças; a
   distância da face medial está no meta), reto ao longo da haste até abrir no assento moldado
   (≈ 8 mm de profundidade). Alternativa sem furadeira: subtrair esse cilindro como "negative part"
   no Bambu Studio antes de imprimir. Verificado numericamente: antes do furo há 179 mm³ de molde
   no caminho do dreno; depois, 0. `entryRound` agora é 0 (o arredondamento antigo deixava um lábio
   que estreitava a entrada abaixo do OD).
3. **Respiro da cúpula (MANUAL, recomendado).** O respiro do app fica em z = 45, não no topo da
   cabeça. Furar **Ø 2 mm na face proximal do bloco, na costura**, a 17,4 / 18,7 / 19,9 mm da face
   lateral (cabeças 44 / 48 / 52) — é o ponto mais alto da cúpula. Indispensável se o cimento for
   injetado pelo dreno com a cabeça para cima; útil também no enchimento manual das metades.

Tudo isso vai no `meta.moldPrep` de cada build (bloco, sprue, almofada, respiro do app, furo do
dreno, respiro da cúpula, com distâncias para a margem `moldMargin`). **Decisão do cirurgião
pendente:** aceitar estes 2 passos manuais (ou o "negative part" no fatiador), já que o app não
muda mais.

## Qual foto segue e como

- `84989-6268795.jpg` (dois espaçadores, curto e longo, vistos de cima/lado) e `images (1).jpeg`
  (vista frontal): cúpula, alma triangular, haste reta com sulco, borda lateral rente à haste.
- A alma da foto é uma lâmina fina; aqui ela tem **10 mm em Y** com borda livre toda arredondada
  (núcleo poligonal dilatado por uma esfera de 5 mm) e filete de 6 mm em todas as junções.
- As hastes longas das fotos viraram o **dreno de tórax**; só o começo da haste é moldado.
- Nada foi copiado de produto: proporções só como referência.

### Proporções medidas nas fotos (pixels)

| Medida | `images (1).jpeg` | `84989` (peça longa) | Modelo A (cabeça 48) |
|---|---|---|---|
| Ø da base da cabeça (borda) / Ø da haste | 102/21 = **4,9** | 165/45 = **3,7** | 47,5/11 = **4,3** |
| comprimento total / Ø da base | 312/102 = **3,06** | 457/165 = **2,8** | 110/47,5 = 2,3 (curta) · 150/47,5 = **3,16** (longa) |
| haste livre (raiz da alma → ponta) / Ø da base | 225/102 = **2,2** | 312/165 = **1,9** | (50,5 + 20)/47,5 = 1,5 (curta) · (50,5 + 60)/47,5 = **2,3** (longa) |
| cúpula além da face medial da haste / Ø da base | 62/102 = **0,6** | — | 23,2/47,5 = **0,49** |
| borda lateral × face lateral da haste | rente (≈ 0) | rente | 2,5 mm lateral (`latOverhang`) |
| inclinação do eixo da cabeça | ≈ 52° da vertical (NSA ≈ 128°) | — | 45° (NSA 135°, parâmetro 125–140) |
| borda livre da alma / Ø da base | — | 60/165 = **0,37** | 14,3/47,5 = **0,30** |

Normas usadas (pesquisa `07_geometria.md` §4): altura da cabeça 19 ± 2,4 mm (Iannotti) → aqui
h/D 0,43 = 18,9 / 20,6 / 22,4 mm (cabeças 44/48/52); centro da cabeça 3,4–5,9 mm medial ao
eixo da haste (Hertel: 3,9–8,6 mm).

## Parâmetros

| Nome | Unid. | Padrão | Faixa | O que faz |
|---|---|---|---|---|
| `headD` | mm | 48 | 40–58 | diâmetro da esfera da cabeça (gerar 44/48/52) |
| `headHD` | — | 0,43 | 0,37–0,50 | altura/diâmetro da calota |
| `rimFillet` | mm | 3 | 2–5 | toro na borda da cabeça |
| `nsDeg` | ° | 135 | 125–140 | ângulo colo-diáfise (inclinação β = 180 − NSA) |
| `proxLength` | mm | 90 | 75–140 | comprimento do positivo: face distal (z = 0) → topo da cúpula |
| `totalLength` | mm | 110 | 100–200 | construto inteiro (cúpula → ponta do dreno); só define o corte do dreno. Curta 110 · longa 150 |
| `stemD` | mm | 11 | 8–14 | Ø da haste moldada (sobe para o OD do dreno se o dreno for mais grosso) |
| `tubeFr` | Fr | 28 | 24–36 (oferecer 24/28/32/36) | dreno de tórax; OD = Fr/3 (8,0 / 9,33 / 10,67 / 12,0 mm) |
| `couplingLen` | mm | 15 | 10–25 | profundidade do assento do dreno |
| `stopOverlap` | mm | 0,65 | 0,6–1,5 | quanto o batente cobre a parede do dreno, por lado (0,65 mantém a cintura de 28 Fr ≥ 8 mm) |
| `seatDeg` | ° | 50 | 40–55 | ângulo do batente cônico (50° mantém o raio da cintura ≥ 2 mm com 0,65) |
| `waistMinD` | mm | 8 | 8 | regra travada "haste Ø ≥ 8": o build **recusa** cintura menor |
| `waistExempt` | 0/1 | 0 | 0–1 | 1 = cirurgião isentou a cintura da regra (necessário para 24 Fr) — **não decidido** |
| `stopRound` | mm | 0,6 | 0–1 | raio na borda do batente |
| `flareDeg` | ° | 20 | 12–35 | alargamento cintura → haste (a partir do eixo) |
| `flareRound` | mm | 4 | 2–8 | arco convexo alargamento → haste |
| `entryRound` | mm | 0 | 0–2 | raio na borda distal do assento (> 0 deixa um lábio no molde que estreita a entrada) |
| `coreWireD` | mm | 3,2 | 2–4 | fio-guia (só meta, não subtraído) |
| `coreWireCover` | mm | 8 | 5–15 | cimento acima da ponta proximal do fio |
| `latOverhang` | mm | 2,5 | 0,5–4 | borda lateral da cabeça além da face lateral da haste |
| `webT` | mm | 10 | 10–16 | espessura da alma em Y |
| `webReach` | — | 0,66 | 0,55–0,75 | onde a alma toca a base (fração do Ø da borda, a partir da borda lateral); sobe sozinho em NSA baixo + cabeça pequena (`meta.dims.webReachUsed`) |
| `webDrop` | × D | 0,26 | 0,18–0,40 | raiz da alma abaixo do ponto de contato |
| `webSag` | — | 0,10 | 0–0,2 | concavidade da borda livre da alma |
| `grooveDepth` | mm | 1,2 | 0–1,5 | sulcos ±Y (reduz sozinho para sobrar ≥ 8 mm entre os fundos; < 0,5 mm → sem sulco) |
| `grooveWidth` | mm | 3 | 2–4 | largura do sulco |
| `grooveFlareGap` / `grooveWebGap` | mm | 4 / 3 | 1–15 / 1–10 | folgas do sulco até o alargamento e até o filete da alma |
| `fillet` | mm | 6 | 3–8 | largura do filete (smin) em todas as junções (5 deixava vinco de 2 mm a 40° na junção alma → base em NSA 125 com cabeça 40–44) |
| `edge` | mm | 0,6 | 0,4–1,0 | aresta do levelSet |
| `printerMm` / `moldWall` | mm | 180 / 10 | — | checagem: extensão da peça + 2 × parede ≤ cubo da impressora |
| `moldMargin` | mm | 6 | 3–15 | margem do app de molde (slider "margem"): só para as coordenadas dos passos manuais |
| `sprueD` | mm | 10 | 6–14 | Ø do sprue do app (slider) |
| `sprueGateT` | mm | 8 | 6–10 | espessura mínima (Y) da peça sob todo o disco do sprue; abaixo disso entra a almofada |
| `sprueCover` | mm | 2,5 | 1–5 | quanto o contorno da almofada passa da borda do sprue |
| `padFillet` / `padBridgeFillet` | mm | 5 / 8 | — | filete da almofada; da almofada estendida até a alma |
| `padBridgeGap` | mm | 4,5 | 0–99 | folga almofada → cabeça abaixo da qual a almofada é estendida até a alma |
| `domeVentD` | mm | 2 | 1,5–3 | Ø do respiro manual no topo da cúpula |

## Meta exportado (no `.json`)

`headCenter`, `headD`, `NSA`, `head` (ajuste da esfera), `dims` (alturas da borda, raiz/ápice
da alma, sulcos, etc.), e:
- `tube`: `fr`, `od`, **eixo** `{point: [0,0,15], direction: [0,0,-1]}` (fim do dreno no batente,
  dreno segue distal), `couplingLength` 15, `seat`, `stop` (cone 50°, cintura Ø, raio),
  `tubeLength` (corte = totalLength − proxLength + couplingLen: **35 mm** na curta, **75 mm** na
  longa), `seatVolumeCm3`, `moldNote` (diz que o furo é manual; o app não o faz).
- `moldPrep`: bloco do app, sprue (centro xz, almofada), respiro do app, **furo do dreno** e
  **respiro da cúpula** (face, distâncias às faces lateral/medial do bloco, Ø da broca).
- `meshRepair.invertedNeedleFlips`: quantas agulhas invertidas foram desviradas (ver abaixo).
- `coreWire`: Ø 3,2, polilinha no eixo (curta: z −20 → 81,5; longa: z −60 → 81,5), comprimento.
- `printer`: extensão da peça e envelope de cada metade do molde.

## Validação (todas passam: 1 componente, gênero 0, 0 linhas Y com contrassaída, simétrica, vinco 0 mm)

| Variante | Volume | PMMA* | Pacotes 40 g | Cimento moldado** | Esp. mín / p1 | Desmolde Y | Simetria | Esfera (facet) | Triângulos |
|---|---|---|---|---|---|---|---|---|---|
| cabeça 44 | 27,00 cm³ | 31,9 g | 1 | 26,0 cm³ · 30,6 g · 1 | 6,54 / 8,85 mm | 0 / 12 060 | 0,0015 mm | 0,0094 mm | ≈ 101 000 |
| **cabeça 48** | 32,68 cm³ | 38,6 g | 1 | 31,7 cm³ · 37,4 g · 1 | 6,66 / 9,07 mm | 0 / 13 320 | 0,0016 mm | 0,0096 mm | ≈ 107 000 |
| cabeça 52 | 39,36 cm³ | 46,4 g | 2 | 38,3 cm³ · 45,2 g · 2 | 6,22 / 8,98 mm | 0 / 14 400 | 0,0016 mm | 0,0094 mm | ≈ 110 000 |
| 48, 24 Fr (`waistExempt=1`) | 32,33 cm³ | 38,1 g | 1 | 31,6 cm³ · 37,3 g · 1 | 6,83 / 8,00 mm | 0 | 0,0016 | 0,0096 | — |
| 48, 32 Fr | 33,09 cm³ | 39,0 g | 1 | 31,8 cm³ · 37,5 g · 1 | 6,92 / 9,39 mm | 0 | 0,0017 | 0,0096 | — |
| 48, 36 Fr (haste sobe a 12) | 34,12 cm³ | 40,3 g | 2 | 32,4 cm³ · 38,3 g · 1 | 7,26 / 10,0 mm | 0 | 0,0016 | 0,0096 | — |
| 48 curta (110) / longa (150) | positivo idêntico ao 48 | | | | | | | | |

\* PMMA com densidade **suposta** 1,18 g/cm³ (hipótese, não medida). \*\* Volume menos o
assento do dreno (1,03 cm³ em 28 Fr), que é ocupado pelo dreno. O cimento dentro do dreno não
entra na conta: o Ø interno dos drenos não é publicado — medir com paquímetro. A almofada do
sprue soma ≈ 1,7–2,3 cm³ em relação à versão anterior.

Checagem com o **próprio app de molde** (`generateMold` do `moldapp`, parâmetros padrão, plano
y = 0, rodado em node sobre os STLs): sprue sobre a peça em **100 %** do disco (antes 16 / 3,4 /
0 %), espessura mínima sob o sprue 8,65 mm, volume sprue ∩ peça 796 / 780 / 771 mm³ (antes
50 / 3 / 0); metades manifold; 2 pinos colocados (o 3º colide com a cavidade — igual antes).
Parede no caminho do dreno 179 mm³ → 0 depois do furo manual simulado.

Cintura do acoplamento (corte do STL): **Ø 8,04 mm em z 16,8** (meta 8,03), raio 2,18 mm; em
volta do fio de Ø 3,2 sobram 2,42 mm de cimento. 32 Fr: Ø 9,37; 36 Fr: Ø 10,7. **24 Fr: Ø 6,70
— o build recusa** (a cintura máxima possível com 24 Fr é 6,8 mm) a não ser com `waistExempt=1`.

Outras medidas (cabeça 48): altura da cabeça 20,6 mm; borda Ø 47,5; base plana Ø 40,0; centro
da cabeça 4,7 mm medial, z 66; borda medial z 51,6, lateral z 85,2; alma: raiz z 50,5, contato na
base (12,4; 63,0); almofada do sprue centrada em (10,3; 45), contorno R 7,5 mm (z 37,5–52,5);
sulcos z 26,0–34,5, 1,2 × 3 mm (param antes da almofada). Precisão do assento (malha STL): raio
4,658–4,667 mm para OD/2 = 4,667.

Impressora: peça 36,7 × 46,0 × 90,0 mm → metade do molde ≈ 57 × 66 × 110 mm com 10 mm de
parede (com a margem de 6 mm do app: bloco 48,7 × 58 × 102); cabe no cubo de 180 mm.
`proxLength` 140 (máximo) dá molde de 160 mm.

Robustez: varredura NSA {125, 130, 135, 140} × h/D {0,37; 0,43; 0,50} × cabeça {40, 44, 48, 52,
58}: **53 de 60 passam; todas as 20 com h/D 0,43 (padrão) passam**, inclusive cabeça 44 com NSA
125 (vinco 0) e 140 (vinco 0) — ver "Limites". `node test/foundation_test.mjs` continua 59/59.

## Como foi construído (resumo técnico)

1. Corpo por SDF + `levelSet` (grade simétrica em Y): haste (sólido de revolução exato do perfil
   (r, z)), alma (polígono dilatado), e um "proxy" da cabeça encolhido (0,4 mm na cúpula, 0,6 mm
   na base) — união suave (filete 6 mm) → toda junção tem filete, inclusive haste → borda lateral
   e alma → base da cabeça (o filete encontra a base a ≈ 28°, abaixo do limite de 35°).
2. Cabeça **exata** (`sphereSegment`, facetas ≤ 0,01 mm) unida por cima.
3. Acoplamento + alargamento **exatos** (`revolveProfile`, tolerância 0,005 mm) abaixo de
   z ≈ 23 mm; o levelSet é aparado nesse plano e um encaixe de 0,8 mm dentro da haste une as
   duas partes. (O levelSet deixava covinhas < 0,01 mm nas arestas do assento que o teste de
   desmolde lia como contrassaída.)
4. Almofada do sprue no SDF do corpo (quando precisa), com o filete dela recortado para nunca
   pôr material sobre a calota polida.
5. **Reparo de agulhas invertidas.** A união funde a base plana da cabeça num polígono só e o
   retriangula com diagonais longas (≈ raio da base); onde o contorno do levelSet tem dois
   vértices a µm um do outro junto dessa diagonal, sai um triângulo-agulha (altura < 1 µm)
   **virado** no plano — era a "dobra de 180°" de 18 mm da cabeça 44 com NSA 125/140 (não era
   geometria: era triangulação). Essas arestas são trocadas (edge flip) sem mover vértice;
   volume e gênero conferidos. Sobram micro-dobras em lascas ≤ 0,32 mm de aresta (antes 4/6/8 por
   cabeça 44/48/52, agora 2/1/5): quase todas na costura z = 22,55 (arredondamento float32 do
   STL) e uma na base da cabeça 44 (0,26 mm, ~1 µm de altura). O validador as ignora (lascas) e
   não têm tamanho para aparecer no molde.

## Limites conhecidos

- **Curta e longa têm o mesmo positivo**: a diferença é só o comprimento do dreno
  (35 × 75 mm cortados; 20 × 60 mm para fora da peça). Se quiser a curta com menos haste moldada,
  baixar `proxLength` (mínimo ~75 com cabeça ≤ 52; com cabeça 58 precisa de ≥ ~85).
- A cintura do acoplamento é o ponto mais fino do cimento moldado: Ø 8,03 (28 Fr), 9,37 (32 Fr),
  10,7 (36 Fr).
- O batente é cônico (50°), não um degrau plano: um degrau plano com filete ≥ 2 mm deixaria a
  cintura fina demais. O dreno para na borda externa do cone e fica centrado; 0,65 mm por lado
  cobre ~metade da parede do dreno de 28 Fr.
- O furo do dreno e o respiro da cúpula são **passos manuais** (o app de molde está congelado).
- **Cintura de 24 Fr (decisão pendente do cirurgião).** A regra travada "haste Ø ≥ 8 mm" vale
  para a cintura do acoplamento (padrão agora 8,03 mm em 28 Fr). Com 24 Fr (OD 8,0) a cintura
  não passa de 6,8 mm sem soltar o dreno, então o build recusa; só gera com `waistExempt=1`.
  Argumento para isentar: a cintura continua no cimento do lúmen do dreno, que já é mais fino
  (Ø interno ~6 mm), e é reforçada pelo fio e pela parede do dreno. Argumento contra: é a
  transição rígida → flexível, ponto de flexão. Até decidir, oferecer 28/32/36 Fr.
- **Almofada do sprue.** Muda a silhueta (um bulbo arredondado abaixo da alma, 10 mm em Y).
  Fica na região metafisária medial, abaixo do colo; o toco do sprue (Ø 10) sai das faces ±Y dela
  e é cortado rente. Se o cirurgião não quiser o bulbo, a alternativa é abrir o sprue à mão num
  ponto da cabeça e ignorar o do app.
- **Cantos da faixa (varredura de 60 builds, 53 passam):** todas as h/D 0,43 passam. Falham:
  - NSA 125: 40/0,37 (vinco 4,3 mm a 40°), 44/0,37 (1 linha Y de ~10 000, tangente ao plano da
    base — teste degenerado), 58/0,37 (vinco 3,2 mm a 37,5°), 44/0,50 e 48/0,50 (vinco 9,5 e
    4,7 mm onde a almofada encosta na borda medial);
  - NSA 130: 58/0,37 (vinco 2,2 mm a 35,9°, no limite);
  - NSA 135: 48/0,50 (1 linha Y na borda lateral, tangente).
  Antes de usar esses cantos, rodar o build e conferir que passa.
- Densidade do PMMA suposta (1,18 g/cm³); Ø interno do dreno não publicado.
- Não é implante validado: é positivo de molde de bancada; validação dimensional antes do uso.
