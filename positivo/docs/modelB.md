# Modelo B — "Anatômico" (parte proximal para haste de tubo de tórax)

Positivo (sólido fechado, STL) do espaçador de PMMA com antibiótico, só úmero. O sistema de molde
(sessão OpenCode) transforma este sólido em molde bipartido. Código:
`src/models/modelB.mjs`. Geração: `node build.mjs --model B --head 44,48,52`.

## O que é

Arquétipo **anatômico** do desenho Synicem (foto comercial de referência, não publicada aqui):
corpo proximal com forma de metáfise de haste anatômica, calcar medial em curva côncava que
entra na base da cabeça, **ombro lateral arredondado** (onde fica a grande tuberosidade) com 3
furos de sutura, cabeça esférica polida (calota quase hemisférica) no plano de ressecção, NSA 135°.
As tuberosidades ficam no paciente.

**Decisão do cirurgião (26/set/2026):** a haste distal é um **tubo de tórax cheio de cimento**
(técnica Klosterman 2021, PMC7917196). A impressora é uma Bambu Lab A1 mini (180 × 180 × 180 mm),
então o positivo é **só a parte proximal**: cabeça + corpo + ombro/aleta + um segmento curto de
haste que termina num **acoplamento do tubo**:

- **Espiga** (spigot) cilíndrica Ø = DE do tubo (Fr/3 mm), de z = 0 até z = `couplingLen`
  (15 mm). No molde ela vira o furo que assenta a ponta do tubo e o mantém coaxial.
- **Batente** plano (anel perpendicular a Z) em z = `couplingLen`, onde a haste alarga para
  Ø = DE + 2·`shoulderW`. A ponta do tubo fica nesse plano.
- **Fio/pino central** (aço inox, Ø 3,2 mm por padrão) reto no eixo da haste, contínuo pelo tubo e
  por esta peça até a cabeça, com 10 mm de cimento até a cúpula. **Não é subtraído** (o sólido é
  cheio); a polilinha vai no `meta.core`.

### Furo do tubo no molde (revisão 26/set/2026)

**Nenhum dos dois geradores de molde abre passagem para o tubo a partir deste STL.** O `moldapp`
faz o bloco = caixa do modelo + 6 mm em cada lado, então a face distal da espiga (z = 0) fica
fechada dentro de um piso de 6 mm: a espiga vira um bolso cego. O caminho `lib/src/mold.js`
(`buildMold`) fura o tubo, mas limita `tubeFr` a 24–34 (36 Fr ganharia furo Ø 11,63 sob espiga de
12 mm) e põe o canal de injeção a partir do centro de cabeça dele (0,3·D), que segundo a revisão
para ~4,6 mm antes da cavidade do B. Como o sistema de molde não será mais atualizado, **o lado do
positivo fornece a ferramenta e o pós-processamento** (em `src/models/modelB.mjs`):

- `node src/models/modelB.mjs bore-tool` → `stl/B_tube_bore_{24,28,32,36}Fr.stl`: cilindro no
  eixo da haste, Ø = DE + `boreClearance` (0,3 mm → 8,30 / 9,63 / 10,97 / 12,30 mm), de z = −40 até
  z = `couplingLen` (15), **no referencial do positivo**. Serve para subtrair das metades no
  fatiador (Bambu Studio: adicionar peça → "peça negativa") se as metades estiverem nesse
  referencial.
- `node src/models/modelB.mjs bore-mold --positive stl/B_h48.json --halves A.stl,B.stl [--out pasta]`
  → grava `<metade>_bore.stl`. Acha o referencial das metades sozinho (o bloco é a caixa do
  positivo + margem uniforme, então o centro do bloco = centro da caixa do positivo; o `moldapp`
  re-centra o modelo, o `lib` não) e **confere**: o positivo deslocado não pode sobrepor as metades,
  o piso tem de estar bloqueado antes e aberto depois; se não, aborta.
- Testado com metades geradas pelo próprio `moldEngine.generateMold` (B_h48, 28 Fr, eixo Y,
  bloco 61,0 × 59,8 × 127,0 mm): deslocamento (−5,50; 0; −57,50) mm, sobreposição positivo × metade
  0,001 mm³, piso dentro do furo 162,8 mm³ antes → **0 mm³ depois** em cada metade, 249,8 mm³
  removidos por metade. Controle negativo: o JSON do B_h52 contra as metades do B_h48 → aborta
  ("positive overlaps the half").
- Serve para 24/28/32/**36** Fr. Com o `buildMold` do `lib`, 36 Fr **não** funciona (limite 34 Fr)
  e o canal de injeção não chega na cavidade: usar o `moldapp` + `bore-mold`, ou fazer o furo à mão.
- O anel de parada mecânico para o tubo (ver "Limites") depende da mesma decisão e continua em
  aberto: **decisão do cirurgião** sobre qual caminho de molde usar.

### O cimento dentro do tubo (revisão 26/set/2026)

Abaixo do batente (z < 15) e ao longo de todo o tubo, **o cimento é um bastão do tamanho do lúmen
do tubo, não a haste moldada**. A haste moldada (Ø 13,27 mm com 28 Fr) só existe acima do batente.
Parede do tubo **assumida** 1,3 mm (varia com a marca: medir com paquímetro; parâmetro `tubeWall`):

| Tubo | DE (mm) | Lúmen assumido (mm) | Cimento entre fio Ø 3,2 e parede do tubo (mm) | Regra "haste ≥ 8 mm" |
|---|---|---|---|---|
| 24 Fr | 8,00 | 5,4 | 1,1 | **não cumpre** |
| 28 Fr (padrão) | 9,33 | 6,7 | 1,8 | **não cumpre** |
| 32 Fr | 10,67 | 8,1 | 2,4 | cumpre (no limite) |
| 36 Fr | 12,00 | 9,4 | 3,1 | cumpre |

- No plano do batente (z = 15) a seção de cimento salta do lúmen (6,7 mm com 28 Fr) para 13,27 mm.
  O canto reentrante desse degrau é feito pela **ponta cortada reta do tubo**, não por este
  positivo: o arco de 0,6 mm do positivo não controla esse canto. Chanfrar por dentro a ponta do
  tubo com lâmina abre o ângulo.
- Dentro do tubo quem carrega a carga é o **fio de aço** (e o próprio tubo); o cimento ali é fino
  (1,1–3,1 mm sobre o fio). A cobertura mínima medida acima do batente é 3,3 mm (`meta.core`).
- A regra travada "haste ≥ 8 mm" não é cumprida pelo bastão de cimento com 24 e 28 Fr.
  **Decisão do cirurgião**: escolher o Fr sabendo disso (32 Fr dá ~8 mm de cimento; 36 Fr ~9,4 mm,
  mas a haste moldada vai a 16 mm). O padrão continua 28 Fr. `meta.tube.cementSectionStep`
  registra o degrau e marca `belowLockedMin8`.
- Encurtar ou alongar a espiga não muda o bastão; só muda onde fica o degrau. Com espiga de 15 mm
  o degrau fica ~40 mm abaixo do início da metáfise.

Referencial (contrato do molde): mm; eixo da haste = +Z; face distal em z = 0; +X = MEDIAL;
Y = AP; simétrico em y = 0 (plano de partição; desmolda em ±Y). O mesmo sólido serve direito e
esquerdo.

## Como foi construído

- Corpo por SDF + `levelSet`: metáfise = triângulo no plano XZ (ápice no eixo, lado de cima no
  plano de corte) varrido por uma esfera cujo raio cresce do raio da haste até `bodyAP`/2 (expoente
  1,6 → curva côncava do calcar); aleta = cápsula em XZ extrudada em Y com faces planas, bordas
  arredondadas e **ângulo de saída de 5°** nas paredes laterais; união suave (smin) com um
  "proxy" da cabeça para fazer o filete entre corpo e base plana.
- Cabeça = `sphereSegment` exato (desvio de faceta ≤ 0,01 mm), unido por cima.
- Acoplamento do tubo = sólido de revolução **exato** (espiga, arco côncavo 0,6 mm, anel plano,
  arco convexo 0,6 mm, haste Ø 2·rS, e um afunilamento de 0,35 mm em cosseno que mergulha no
  cilindro do levelSet). Assim a face distal e o batente são planos de verdade.
- Aleta com um segmento distal ("reforço") que desce em direção medial até a haste
  (`finTaper`, `finTaperLen`): a ponta quadrada da cápsula contra a haste deixava raio côncavo
  < 2 mm com 24 Fr e com h/D 0,40/0,63.
- Furos de sutura Ø 2,5 mm atravessando em Y, na parte plana da aleta, a cada 8,5 mm
  (ponte de cimento entre furos = 8,5 − 2,5 = **6,0 mm**, medida no sólido final).
- Todas as peças são pares em y e não-decrescentes em |y| → cada reta paralela a Y encontra o
  sólido num só intervalo que contém y = 0.

Lições desta rodada (ficaram no código): (1) blend `smin` entre duas superfícies coincidentes
(haste e metáfise com o mesmo raio) incha ~2 mm — usar `min` onde coincidem; (2) filete de cabeça
que chega perto da borda da base cria vinco — o raio do blend encolhe em direção à borda lateral;
(3) parede exatamente paralela a Y (aleta sem saída) e cauda de filete quase tangente ao plano da
base (que contém Y) fazem os raios do teste de desmoldagem correrem ao longo das facetas do
levelSet — resolvido com saída de 5° na aleta e filete encontrando a base a ~13°; (4) se ainda
sobrar um raio rasante (µm, na silhueta), o modelo re-malha com a grade deslocada/edge ±7 % até
8 vezes; tentativas ficam em `meta.meshing`. Defeito real não some com a grade; só ruído some.
Agora a re-malha também dispara com vinco (dobra de 180° que apareceu uma vez na junção da
cabeça com NSA 140).

Revisão de 26/set/2026 (lições novas): (5) a verificação de vinco do `validate()` vai por ângulo
(35°) e não vê um filete liso mas apertado; foi criada uma verificação por **raio** (abaixo);
(6) `headFilletAngleDeg` tem janela estreita: 13° deixava um "quebrado" de ~30° onde o filete
cruza a base da cabeça; 8° ainda deixava R 1,7–1,99 mm em D44, h/D 0,63 e NSA 125; 6° criou uma
lasca de retenção em Y com NSA 140; **7°** passa em tudo o que foi gerado; (7) o raio do filete
cabeça–calcar é limitado pela distância até a borda da base (`kHead` maior não muda nada): o
que resolve é afastar a ponta medial da pegada da borda (`medialRimGap` 14 mm, `footprintMaxML`
30 mm); (8) `kFin` 7 fazia a união aleta–corpo invadir a saída dos furos de sutura no D52
(aresta viva de 76°): voltou a 5, e o reforço distal da aleta resolveu o que o `kFin` maior
resolvia.

### Verificação de raio côncavo (nova)

Para cada seção plana, faz o **fechamento morfológico** com um disco de raio r (offset +r e −r):
só acrescenta material onde um canto côncavo é mais apertado que r. Busca binária no maior r que
não acrescenta região mais grossa que 0,03 mm = raio côncavo estimado. Pelo teorema de Meusnier a
curvatura da seção é ≥ a curvatura normal da superfície naquela direção, então passar numa seção é
conservador. Três famílias, cada uma perpendicular aos filetes que verifica: y = 0…5 mm (perfil XZ;
entalhe sob a borda lateral da cabeça), 10 planos meridianos pelo eixo da cabeça (junção
base da cabeça ↔ corpo em volta toda), z = constante (aleta ↔ corpo ↔ haste, fora da sombra da
cabeça). Exclui o acoplamento do tubo (arcos de 0,6 mm propositais) e a vizinhança dos furos.
Limite `minConcaveR` = 2 mm; se falhar, o build **para** com o local. Resultado em
`meta.checks.concaveRadius`.

## Parâmetros

| Nome | Unid. | Padrão | Faixa | O que faz |
|---|---|---|---|---|
| headD | mm | 48 (gerar 44/48/52) | 40–58 | diâmetro da esfera da cabeça |
| headHD | – | 0,50 | 0,37–0,63 | altura/diâmetro da calota (0,5 = hemisfério) |
| rimFillet | mm | 2 | 0–4 | arredondamento da borda da cabeça |
| nsDeg | ° | 135 | 125–140 | ângulo colo-diáfise |
| headOffset | mm | 6 | 0–10 | offset medial do centro da cabeça |
| totalLength | mm | 115 | 95–140 | comprimento do positivo em Z (face distal → topo da cabeça) |
| tubeFr | Fr | 28 | 24 / 28 / 32 / 36 | tubo de tórax; DE = Fr/3 (8,0 / 9,33 / 10,67 / 12,0 mm) |
| couplingLen | mm | 15 | 8–25 | comprimento da espiga (assento do tubo) |
| shoulderW | mm | 2 | 1,5–4 | largura radial do batente; haste Ø = DE + 2·shoulderW |
| shoulderFillet | mm | 0,6 | 0,4–1,5 | arco côncavo espiga → batente |
| stemEdge | mm | 0,6 | 0,4–1,5 | arco convexo na borda externa do batente |
| metaLen | mm | 45 | 30–60 | distância abaixo do corte onde a metáfise começa a alargar |
| footprintML | mm | null (= 0,583·headD, ≤ footprintMaxML) | 22–40 | pegada ML no plano de corte |
| footprintRatio | – | 0,583 | 0,5–0,7 | pegada/headD quando footprintML é null |
| footprintMaxML | mm | 30 | 22–40 | teto da pegada calculada pela razão |
| medialRimGap | mm | 14 | 6–16 | ponta medial da pegada afastada da borda da base (espaço para o filete do calcar) |
| bodyAP | mm | 20 | 14–25 | espessura AP do corpo no plano de corte |
| footprintMargin | mm | 5 | 2–6 | recuo lateral da pegada dentro da borda da cabeça (espaço para filete ≥ 2 mm sob a borda lateral) |
| calcarPow | – | 1,6 | 1–3 | curvatura do calcar (>1 = côncavo) |
| shoulderX | mm | 19 | 12–22 | alcance lateral mínimo do ombro a partir do eixo |
| holeBodyClear | mm | 11 | 8–16 | linha dos furos afastada do núcleo do corpo (furo sai em face plana) |
| finGap | mm | 6 | 3–12 | topo da aleta abaixo do plano de corte (fora da sombra da borda) |
| finAP | mm | 12 | 8–20 | espessura AP da aleta (faces planas) |
| finEdge | mm | 3 | 1–4 | arredondamento das bordas AP da aleta |
| finDraftDeg | ° | 5 | 2–10 | saída das paredes laterais da aleta |
| finTaper | – | 0,6 | 0–1 | o reforço distal termina em (1 − finTaper)·x da linha dos furos |
| finTaperLen | mm | 12 | 0–25 | comprimento em z do reforço abaixo do último furo |
| sutureHoles | – | 3 | 0 ou 3 | furos de sutura em Y |
| holeD | mm | 2,5 | 1,5–3,5 | diâmetro do furo |
| holeSpacing | mm | 8,5 | 8,5–12 | distância entre centros (ponte = holeSpacing − holeD ≥ 6, conferida) |
| holeCement | mm | 6 | 5–8 | cimento em volta de cada furo (no plano XZ) |
| coreD | mm | 3,2 | 2–4 | fio/pino central (só relatado) |
| coreHeadCover | mm | 10 | 6–16 | cimento entre a ponta do fio e a cúpula |
| tubeWall | mm | 1,3 | 0,8–2 | parede do tubo **assumida** (só relatório: lúmen = DE − 2·parede) |
| boreClearance | mm | 0,3 | 0,1–0,8 | folga diametral da ferramenta de furo do tubo |
| kFin / kHead / kHeadMin | mm | 5 / 8 / 4 | 2–10 / 2–12 / 1–8 | larguras dos filetes (aleta; cabeça no calcar; cabeça junto da borda) |
| headFilletAngleDeg | ° | 7 | 6–30 | ângulo em que o filete encontra a base plana da cabeça |
| minConcaveR | mm | 2 | 2–4 | raio côncavo mínimo exigido (verificação por seções) |
| proxyRimMargin | mm | 0,5 | 0,3–3 | recuo do proxy da cabeça dentro da borda |
| edge | mm | 0,7 | 0,4–1,2 | aresta do levelSet |

## Proporções medidas nas fotos (pixels)

Synicem (imagem 268 × 335 px, contorno interno):
- corda da base da cabeça 95 px, altura da calota 40 px → esfera ≈ 96 px, **h/D ≈ 0,42**;
- linha de corte a 47,6° da horizontal → **NSA ≈ 132°**;
- comprimento total 293 px → **D/L ≈ 0,33**; se D = 48 mm, escala ≈ 0,5 mm/px (L ≈ 146 mm);
- centro da cabeça 11 px medial ao eixo da haste → **offset ≈ 0,11·D (≈ 5,5 mm)** → usei 6 mm;
- ombro lateral 27 px lateral ao eixo → **≈ 0,28·D (13,5 mm)**; usei 19 mm no D48 (a aleta
  precisa sair do corpo para os furos terem face plana e ≥ 6 mm de cimento);
- haste 22 → 17 px → **≈ 0,2·D (10 mm)**; aqui a haste virou tubo, e o segmento moldado tem
  Ø = DE + 4 mm (projeto 13,33 mm com 28 Fr; **medido 13,27 mm** ao longo do fuste);
- furos Ø 5 px (≈ 2,5 mm) a cada 11 px (5,5 mm); primeiro furo 19 px (9,5 mm) abaixo da ponta
  lateral do corte → usei 2,5 mm a cada **8,5 mm** (ponte de 6,0 mm; com 8 mm a ponte era 5,5 mm);
- corpo proximal (topo da cabeça → fim do alargamento do calcar) 110 px ≈ **1,15·D**; no D48 usei
  63 mm (1,3·D) até o início da metáfise.

Conferência: desenho de linha em `images (2).jpeg` D/L ≈ 0,38 (62/165 px); Tecres (foto
`84989-6268795.jpg`) D/L ≈ 0,31 e haste/D ≈ 0,21. Pesquisa `07_geometria.md`: corpo 20 mm abaixo
do corte ML 16–29 × AP 12–25 mm; offset medial normal 3,9–8,6 mm; canal diafisário 11–15 mm.

Usado no corpo junto ao corte (medido 2 mm abaixo do plano, com filete): **ML 26,8 / 29,8 / 33,3 ×
AP 22,5–23,5 mm** para cabeças 44 / 48 / 52 (limite pedido: ML ≤ ~40, AP ≤ ~25; antes da revisão
era 30–36, encolheu para abrir espaço aos filetes ≥ 2 mm sob a borda da cabeça). A 20 mm abaixo do
corte a seção inclui a aleta (ML 37,8–38,8 × AP 15–15,5).

## Validação (build de 26/set/2026, depois da revisão adversarial)

Todos: 1 componente, gênero = nº de furos, **0 retas com retenção em Y**, simetria ≤ 0,0012 mm,
desvio de faceta da cabeça ≤ 0,01 mm (limite 0,05), 0 mm de vinco, sem aviso de aresta viva,
**raio côncavo ≥ 2 mm** em todas as seções verificadas (68–70 seções por peça; o 24 Fr fica em
1,996 mm, julgado na resolução de 0,01 mm), **ponte entre furos 6,00 mm** (medida no STL por
ajuste de círculo: 6,0 / 6,0 em D44, D48 e D52), **fuste moldado 13,27–13,33 mm** com 28 Fr (antes
12,72 com um colar de 13,33: o anel sumiu; a diferença que resta é 0,06 mm no diâmetro).
Espessura mínima ≥ 6,5 mm em todos. Massa de PMMA com densidade **assumida** 1,18 g/cm³; saco de 40 g.

| Variante | Cabeça | Volume (cm³) | PMMA (g) | Sacos 40 g | Espessura mín. (mm) | R côncavo mín. (mm) | Ponte furos (mm) | Ø fuste medido (mm) | Extensão X×Y×Z (mm) |
|---|---|---|---|---|---|---|---|---|---|
| **padrão** | 44 | 43,9 | 51,8 | 2 | 6,52 | ≥ 2 | 6,00 | 13,27–13,33 | 47,0 × 43,8 × 115 |
| **padrão** | 48 | 51,0 | 60,2 | 2 | 6,52 | ≥ 2 | 6,00 | 13,27–13,33 | 49,0 × 47,8 × 115 |
| **padrão** | 52 | 59,8 | 70,5 | 2 | 6,51 | ≥ 2 | 6,00 | 13,27–13,33 | 51,3 × 51,8 × 115 |
| 24 Fr | 48 | 49,2 | 58,1 | 2 | 6,53 | 1,996 | 6,00 | 11,93–12,00 | 49,0 × 47,8 × 115 |
| 32 Fr | 48 | 53,0 | 62,6 | 2 | 6,53 | ≥ 2 | 6,00 | 14,60–14,66 | 49,0 × 47,8 × 115 |
| 36 Fr | 48 | 55,2 | 65,2 | 2 | 6,52 | ≥ 2 | 6,00 | 15,94–16,00 | 49,0 × 47,8 × 115 |
| sem furos | 48 | 51,2 | 60,4 | 2 | 9,33 | ≥ 2 | – | 13,27–13,33 | 49,0 × 47,8 × 115 |
| NSA 125 | 48 | 50,9 | 60,1 | 2 | 6,51 | ≥ 2 | 6,00 | 13,27–13,33 | 49,0 × 47,8 × 115 |
| NSA 140 | 48 | 51,1 | 60,3 | 2 | 6,53 | ≥ 2 | 6,00 | 13,27–13,33 | 49,0 × 47,8 × 115 |
| h/D 0,40 | 48 | 42,9 | 50,6 | 2 | 6,51 | ≥ 2 | 6,00 | 13,27–13,33 | 49,0 × 45,8 × 115 |
| h/D 0,63 | 48 | 61,8 | 72,9 | 2 | 6,54 | ≥ 2 | 6,00 | 13,27–13,33 | 52,1 × 48,0 × 115 |
| canto D40, NSA 140, 36 Fr (**bodyAP 16, footprintMargin 4**) | 40 | 41,4 | 48,8 | 2 | 6,53 | ≥ 2 | 6,00 | 15,94–16,00 | 45,0 × 39,8 × 115 |
| canto D58, NSA 125, 24 Fr, h/D 0,63 | 58 | 92,4 | 109,0 | 3 | 6,51 | ≥ 2 | 6,00 | 11,93–12,00 | 60,7 × 58,0 × 115 |
| D58 padrão | 58 | 74,7 | 88,1 | 3 | 6,53 | ≥ 2 | 6,00 | 13,27–13,33 | 56,4 × 57,8 × 115 |
| totalLength 140 | 52 | 63,2 | 74,6 | 2 | 6,54 | ≥ 2 | 6,00 | 13,27–13,33 | 51,3 × 51,8 × 140 |

O volume inclui a espiga (≈ 1,0 cm³ com 28 Fr), que na prática é ocupada pelo tubo.
O canto D40 com os padrões (bodyAP 20) **é recusado** pelo build (R 1,29 mm no calcar: a pegada
mínima 2·bodyAP/2 + 2 não cabe a 14 mm da borda de uma cabeça de 40); com bodyAP 16 e
footprintMargin 4 passa.

Cabe na A1 mini: o maior caso (61 × 58 × 115 mm) + parede de 10 mm → molde 81 × 78 × 135 mm;
o molde do `moldapp` para B_h48 mede 61,0 × 59,8 × 127,0 mm.

Fio central (D48): de (0,0,0) a (0,0,101,9) mm, direção +Z, 101,9 mm dentro da peça. Cobertura de
cimento medida do batente para cima: mínima 3,3 mm (z = 16), 4,5 mm acima de z = 18. **Dentro do
tubo** a cobertura é (lúmen − fio)/2 = 1,8 mm com 28 Fr e parede assumida de 1,3 mm (`meta.core.coverInTube`).

Arquivos: `stl/B_h{44,48,52}.stl|.json`, `render/B_h{44,48,52}_{front,lateral,oblique,top,sheet}.png`,
ferramentas `stl/B_tube_bore_{24,28,32,36}Fr.stl`; variantes em `variants/B/<nome>/`
(`fr24`, `fr32`, `fr36`, `semfuros`, `nsa125`, `nsa140`, `hd040`, `hd063`, `canto_d40`,
`canto_d58`, `d58`, `len140`).

## Limites conhecidos

- **O batente não segura o tubo mecanicamente.** No molde, a espiga vira um furo Ø DE e acima dele
  a cavidade ALARGA; nada impede o tubo de subir além do plano. Com o molde aberto (técnica
  Klosterman: encher cada metade e fechar) a ponta do tubo é posicionada no plano do batente à vista.
  Um batente físico exigiria estreitar a cavidade acima da espiga para Ø < DE, o que deixaria um
  pescoço de cimento de 8 mm (e é impossível com 24 Fr = 8 mm). Um anel de parada no molde fica
  **bloqueado pela mesma decisão** do furo do tubo (qual caminho de molde usar; o sistema de molde
  não será mais atualizado). Decisão do cirurgião.
- **O furo do tubo no molde não sai do molde sozinho**: usar `bore-mold` (ou a ferramenta
  `B_tube_bore_<Fr>Fr.stl` como peça negativa) antes de imprimir. Ver "Furo do tubo no molde".
- O anel plano do batente é estreito (0,8 mm entre os dois arcos de 0,6 mm) e esses arcos são
  menores que o filete de 2 mm da regra geral: é o canto do assento do tubo, não uma junção de
  cimento livre (a verificação de raio côncavo exclui essa faixa).
- **Bastão de cimento dentro do tubo < 8 mm com 24 e 28 Fr** (regra travada), e o degrau para a
  haste moldada no batente é um canto vivo formado pela ponta do tubo: ver "O cimento dentro do
  tubo". Decisão do cirurgião sobre o Fr.
- Haste moldada Ø 13,3 mm (28 Fr) a 16 mm (36 Fr): no limite superior do canal diafisário medido
  (11–15 mm). Para canal estreito, usar tubo menor ou `shoulderW` 1,5.
- Suturas: furos a 8,5 mm entre centros (o desenho tem ~5,5 mm), para manter 6,0 mm de cimento
  entre furos (8 mm deixava 5,5 mm; a verificação de espessura pulava as amostras perto dos furos,
  por isso agora há a medida `meta.checks.holeBridgeMinMm`).
- A transição entre o acoplamento exato e a haste do levelSet agora é de 0,03 mm no raio
  (0,06 mm no diâmetro; antes 0,3 mm e um anel visível).
- O corpo é malha de levelSet (aresta 0,7 mm): liso ao olho, mas não é superfície analítica; só a
  cabeça e o acoplamento são exatos.
- A pegada ML é proporcional à cabeça (0,583·D, no máximo 30 mm e a 14 mm da borda medial); a
  seção 20 mm abaixo do corte, com a aleta, fica em 38–39 mm.
- `headFilletAngleDeg` tem janela estreita (7° passa em tudo; 6° e 8° falham em algum canto): se
  mudar outro parâmetro de forma e o build recusar, o erro diz o local, e esse é o primeiro
  parâmetro a mexer.
