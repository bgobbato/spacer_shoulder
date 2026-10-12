# Molde de duas metades — espaçador umeral C (cogumelo com aleta)

Pesquisa paralela. **Não é o SchulterPlan** e não vai para o produto. Nada aqui foi impresso nem
testado com cimento ainda. Decisões clínicas são do Dr. Bruno.

O gerador lê o **positivo** do modelo C (`positivo/stl/C_h44|48|52.stl` + `.json`, só leitura)
e faz o molde em duas metades, **ANT** (y > 0) e **POST** (y < 0), para imprimir na Bambu Lab A1 mini.
Motor: manifold-3d 2.5.1 (sem three.js no núcleo). O mesmo código roda no node e na página.

Não repete os defeitos do molde antigo (`spacer/moldapp`, congelado), ver `review/AVALIACAO_FABLE.md`:
nenhuma peça solta dentro da metade; pinos posicionados a partir do bloco real; nenhum pino em cima
de respiro ou canal; nenhuma porta de injeção na cabeça; batente físico para o dreno.

## Como gerar

**Padrão (12/out/2026): C longo, cabeça 52, sem dreno.** `build.mjs` sem argumentos gera
`stl/C_longo_h52_*` (= `--variant long --head 52`); a página abre em "C longo, sem dreno" + cabeça 52.
O C curto + dreno precisa de `--variant short`.

```
node molde/build.mjs                                    # padrão: C longo, cabeça 52 (~23 s)
node molde/build.mjs --variant long --head 44,48,52     # C LONGO, sem dreno, as 3 cabeças
node molde/build.mjs --variant short --head 44,48,52 --fr 28   # C curto + dreno (~12 s por cabeça)
node molde/build.mjs --variant short --head 48 --tube-od 9.6   # OD do dreno medido com paquímetro (mm)
node molde/build.mjs --variant short --head 48 --clear 0.20 --tube-clear 0.5
node molde/build.mjs --variant short --coupons --head 48 --quick   # cupons de calibração (pinos e dreno)
node molde/test/molde_test.mjs                          # testes (curto 44/48/52 × 28 Fr + longo 44/48/52) + python/trimesh
```

Saída em `molde/stl/` (pasta **ignorada pelo git** neste repositório; as cópias publicadas ficam em `../stl/`): `C_h<D>_28Fr_ANT.stl`, `_POST.stl` e `.json` (parâmetros, posições de
tudo, validação, estimativas). Imagens em `molde/render/` (`_exploded`, `_face_ANT`, `_face_POST`,
`_outer_ANT`, `_outer_POST`, `_closed`, `_distal`, `_sheet`). O build sai com erro se qualquer checagem falhar.

**Página** (`index.html`): servir a pasta `spacer/` e abrir `/molde/`:
```
python3 -m http.server 8800      →  http://localhost:8800/molde/   (na raiz do repositório)
```
Escolhe o **modelo** ("C curto + dreno" ou "C longo, sem dreno (150 mm)"), cabeça, Fr ou OD medido
(só no curto), folgas e parede; mostra fechado, aberto, só ANT, só POST; baixa os dois
STL e o relatório. Gera em ~1,5 s (medido no Chrome headless). A página roda só as checagens rápidas;
parede mínima e "cavidade fechada = positivo" rodam no node (`molde_test.mjs`).

## O que o molde tem (e por quê)

| Item | Como está | Por quê |
|---|---|---|
| Partição | plano y = 0, desmolda em ±Y | o positivo já foi validado assim (cada reta em Y cruza a peça num intervalo só) |
| Bloco | retângulo com cantos R5, faces externas planas e paralelas | apoio para grampo e para a mesa da impressora |
| Parede | ≥ 8 mm da cavidade até qualquer face, furo ou gravação (medido: 8,08–8,12 mm, no furo do pino P2) | pedido do cirurgião; parâmetro `--wall` |
| Dreno (haste distal) | furo guia Ø(OD + 0,4) coaxial com a haste (x = y = 0), 25 mm de guia, chanfro de entrada | segura o dreno alinhado; OD = Fr/3 ou medido |
| Batente do dreno | 2 abas planas (medial e lateral) de 2 mm em z = 15, que avançam 1 mm sobre a parede do dreno | o dreno encosta e não entra mais; abas planas paralelas a Y desmoldam (aba radial travaria) |
| Marca de profundidade | régua 1:1 gravada na face externa da ANT sobre o eixo: linha da face distal até o batente + "25" | pôr a ponta do dreno na linha transversal e marcar o dreno na borda distal = 25 mm |
| Fio de aço Ø3,2 | **sem saída e sem apoio no molde** | o fio fica todo dentro do cimento e do dreno (sai pela ponta distal do dreno, que já sai do molde). Qualquer apoio teria de atravessar a cavidade: vira peça solta ou deixa buraco no cimento (defeito M1 do molde antigo). Cobertura mínima de cimento até o molde: 2,07 mm (na faixa das abas), 3,1 mm acima |
| Gabarito do fio | desenho 1:1 do fio gravado na face externa da POST, no lugar real, com traço na dobra (14°, 47 mm acima do batente) e na ponta | dobrar e cortar o fio em cima do próprio molde |
| Enchimento | **aberto** (sem porta de injeção) | decisão D3 da avaliação Fable; nada na calota articular |
| Rebarba | faixa plana de 2,5 mm em volta da cavidade, depois canal 3 × 1,5 mm em cada metade (3 × 3 fechado), com saídas no topo, lateral, medial e junto do furo do dreno | o excesso escapa sem abrir o molde |
| Respiros | Ø2 em ±Y nos pontos mais fundos de cada metade: borda da cabeça (80° do eixo da cabeça; a calota articular vai até 71°) e face plana da aleta | ar preso no fundo da metade de cima; nunca na calota (teste confere) |
| Registro | P1 Ø8 macho na ANT / fêmea na POST; P2 Ø6 macho na POST / fêmea na ANT; chanfro; folga 0,20 mm por lado (cupom da A1 mini, 27/set) | 1 macho + 1 fêmea por metade, diâmetros diferentes: só fecha de um jeito |
| Fechamento | 4 parafusos M5 passantes (Ø5,5), porca sextavada embutida na POST; faces planas servem também para grampo C | aperto uniforme e controlado; porca presa = aperta com uma chave só |
| Abertura | 2 fendas de alavanca (12 × 4 mm, 2,5 mm em cada metade) nas faces lateral e medial, na linha de partição | chave de fenda larga, girar |
| Gravações | "ANT"/"POST", "C 44/48/52", "28FR" (ou "OD 9.6"), 0,8 mm de fundo, na face externa | legível de fora de cada metade |

## Como imprimir (Bambu Lab A1 mini, 180 × 180 × 180 mm)

- **Orientação: face de partição PARA CIMA, face externa (com as gravações) na mesa.** Assim a cavidade
  é uma bacia aberta para cima (nenhum ponto em balanço: a desmoldagem em Y garante isso), o pino macho
  imprime em pé e não precisa de suporte em lugar nenhum. A única ponte é o topo da cavidade sextavada
  da porca (8,4 mm), que o PETG faz bem. *Atenção: o pedido original dizia "face para baixo"; ver decisão 1.*
- **Sem suporte.** Sem brim (a peça é larga).
- PETG, bico 0,4: bico 240–250 °C, mesa 70–80 °C, PEI texturizada (na PEI lisa usar cola bastão —
  PETG gruda demais), ventilação 30–50 %, velocidade padrão do perfil "Generic PETG".
- Camada 0,2 mm; na região da cabeça, **altura de camada variável** (0,08–0,12 mm) no Bambu Studio para
  reduzir o degrau na superfície articular.
- **Passar ferro ("ironing") só na superfície de topo**: a face de partição é a última camada; ferro deixa
  ela plana e a rebarba fica fina.
- Perfis: teste de encaixe/gesso — 4 paredes + 15 % giroide (~3,5 h e ~120 g por metade na cabeça 48,
  estimativa); bancada com cimento — **PETG 100 %** (~10 h e ~335 g por metade, estimativa). Tempo e massa
  são estimativa grosseira (fluxo médio 8 mm³/s); o fatiador dá o número real.
- **PETG é só bancada.** O núcleo do PMMA passa de 100 °C; PETG amolece a 68–80 °C. Para o centro
  cirúrgico: PA12 (SLS/MJF) — ver `research/05_materiais_esterilizacao.md`.

### Calibrar folga antes do molde (20–30 min)
1. `node molde/build.mjs --variant short --coupons --head 48 --quick` → `stl/cupom_pinos_MACHO.stl`,
   `stl/cupom_pinos_FEMEA.stl`, `stl/cupom_dreno_28Fr.stl`.
2. Imprimir com o **mesmo filamento e perfil** do molde. O cupom fêmea tem 5 furos para o pino Ø8 com folga
   0,15 / 0,20 / 0,25 / 0,30 / 0,35 mm por lado (gravado 15…35).
3. Escolher o menor furo em que o pino entra com a mão, sem jogo lateral visível, e sai sem forçar.
   Gerar o molde com essa folga: `--clear 0.20` (por exemplo).
4. Dreno: medir o OD do dreno real com paquímetro (3 medidas, média). O cupom do dreno tem 3 furos
   OD + 0,2 / 0,4 / 0,6 (gravado 2 / 4 / 6). Escolher o que desliza sem folga visível e gerar com
   `--tube-od <OD> --tube-clear <0.2|0.4|0.6>`.

## Uso na bancada, passo a passo (técnica aberta, Klosterman)

Material: molde ANT + POST, 4 parafusos M5 cabeça cilíndrica (inox A2) no comprimento da tabela, 4 porcas M5,
chave Allen 4 mm, óleo mineral, pincel, dreno de tórax, fio de aço Ø3,2, cimento + antibiótico, espátula,
seringa de 20–60 ml, chave de fenda larga, lâmina e lixa.

1. **A seco, antes do cimento**: porcas nas cavidades sextavadas da POST; fechar, pôr e apertar os 4
   parafusos; abrir com a chave de fenda nas fendas laterais. Conferir que fecha de um jeito só.
2. **Dreno e fio**: cortar o dreno no comprimento. Encostar a ponta do dreno na linha transversal da régua
   gravada na face externa da ANT e marcar o dreno com caneta na borda distal do molde (25 mm).
   Dobrar o fio sobre o gabarito 1:1 da face externa da POST (reto até o traço da dobra, 14° para o lado da
   cabeça, cortar no traço da ponta; o trecho reto continua para dentro do dreno).
3. **Desmoldante**: pincelar óleo mineral em toda a cavidade, na face de partição, nos canais e no furo
   do dreno. Deixar escorrer o excesso.
4. **Cimento**: misturar com o antibiótico. Encher o dreno (seringa) e passar o fio por dentro.
   Na fase pastosa, encher **as duas metades** com sobra (um pouco acima da face).
5. **Montar**: deitar o dreno no meio-furo da POST até a marca de 25 mm ficar na borda distal (a ponta
   encosta nas abas do batente) e afundar o trecho dobrado do fio no cimento, apontando para a cabeça.
6. **Fechar**: baixar a ANT sobre a POST (os pinos guiam). Colocar os 4 parafusos e apertar em cruz, aos
   poucos, até as faces encostarem. O excesso sai pelos canais (topo, lateral, medial, junto do dreno) e
   pelos 2 respiros de cada lado. Não abrir para "conferir". Segurar o dreno alinhado; conferir que a marca
   continua na borda distal.
7. **Esperar** a cura completa conforme o fabricante do cimento, com margem. O molde esquenta: não segurar
   a região da cabeça. Na primeira bancada, registrar a temperatura da parede (termopar), se possível.
8. **Abrir**: tirar os parafusos; chave de fenda larga na fenda lateral e na medial, girar devagar,
   alternando. Tirar o espaçador.
9. **Acabamento**: aparar com lâmina a rebarba da linha de partição (passa pelo meio da calota articular,
   no plano médio-lateral) e os 2 tocos dos respiros de cada lado (borda da cabeça e aleta); lixar fino a
   rebarba sobre a calota. Conferir que o dreno ficou no batente.

## Tamanhos (28 Fr, OD 9,33 mm, parede 8 mm) — números do build

| Cabeça | Metade X × Y × Z (mm)¹ | Cimento na cavidade² | Com sobra 30 % | Parafuso M5 | Encaixe/gesso por metade³ | Cimento (PETG 100 %) por metade³ |
|---|---|---|---|---|---|---|
| 44 | 67 × 36 × 131 | 31,4 cm³ ≈ 37 g | ≈ 48 g | × 65 | ~3,3 h · ~110 g | ~9,2 h · ~306 g |
| 48 | 69 × 38 × 131 | 37,4 cm³ ≈ 44 g | ≈ 57 g | × 65 | ~3,5 h · ~118 g | ~10,1 h · ~335 g |
| 52 | 72 × 40 × 131 | 44,7 cm³ ≈ 53 g | ≈ 69 g | × 70 | ~3,8 h · ~127 g | ~11,1 h · ~370 g |

¹ Y inclui o pino macho (6 mm); a espessura do bloco em Y é 30 / 32 / 34 mm por metade. Cabe na A1 mini com folga.
² Cavidade = positivo acima do batente (z ≥ 15) menos as abas. O cimento dentro do dreno não entra.
Densidade 1,18 g/cm³ (mesma premissa do positivo) **não verificada** para PMMA com antibiótico — pesar a 1ª peça.
³ Estimativa grosseira, não saída de fatiador.

## C longo, sem dreno (29/set/2026)

Segunda variante, pedida pelo cirurgião. O C curto + dreno continua igual e continua sendo gerado (STL das
metades do curto conferido byte a byte depois da mudança).

**O espaçador**: peça única de cimento, **150 mm** da ponta ao topo da cúpula, mesma cabeça/colo/aleta/corpo,
haste com a mesma espessura (Ø 11,5 reto abaixo do cone proximal), ponta em meia-esfera. Positivo em
`positivo/stl/C_longo_h<D>.stl` (ver README de lá).

**Por que 150 mm e não 160**: é o **limite da mesa da A1 mini** (180 × 180). A metade do molde mede em Z
8 (parede distal) + 150 + 11 (margem de cima) = **169 mm** e imprime **reta**, sem girar na mesa. Com 160 mm a
metade teria 179 mm: cabe com só 0,5 mm de folga de cada lado, sem margem para
posicionar a peça. Por decisão do cirurgião, nada de colocar a peça na diagonal.

**O que muda no molde**:

| Item | C longo |
|---|---|
| Dreno, furo guia, batente, régua de profundidade | **não existem** |
| Ponta distal | **fechada**: parede de 8,0 mm em volta da ponta arredondada (medido 8,012 mm) |
| Fio de aço Ø3,2 | **furo de saída coaxial Ø3,6** (fio + 0,4) na parede distal, com chanfro de 0,8 mm na boca. O fio passa pelo furo, deita no meio-furo da POST e sai 10–20 mm para fora |
| Rebarba | mesmo anel; 5 saídas: topo, lateral e medial (na cabeça) + **2 novas** baixas na haste (lateral e medial, 25 mm acima da ponta) |
| Respiros, pinos, parafusos M5, fendas | iguais (respiros na borda da cabeça a 80° e na aleta; nenhum na calota) |
| Gravações | "ANT"/"POST", "C LONGO", "44/48/52"; gabarito 1:1 do fio na POST, da face distal até a ponta do fio |
| Arquivos | `stl/C_longo_h<D>_ANT.stl`, `_POST.stl` (sistema do modelo, usados pela página) e **`_ANT_mesa.stl`, `_POST_mesa.stl` (já na posição de impressão)** |

**Por que o fio precisa de saída na ponta** (decisão tomada, justificativa): sem dreno, nada segura o fio. A
haste tem Ø 11,5 e o fio Ø 3,2: sobra só **4,1 mm** de cimento em volta. Na técnica aberta o fio é afundado à
mão no cimento pastoso da POST; se ele descer 4 mm, encosta no molde e fica exposto na lateral da haste, ao
longo de muitos milímetros, no lugar onde a haste mais sofre flexão. O furo na ponta prende a extremidade
distal no eixo (folga 0,2 mm), e o fio é reto e rígido; a dobra fica na região larga do colo, onde há muito
cimento. O preço é um ponto de aço de Ø3,2 exposto na ponta distal, depois de cortar o fio rente. Apoios
dentro da cavidade (espaçadores impressos) ficariam dentro do cimento: descartado. Se o cirurgião preferir
o fio todo enterrado: `--set wireExit=false` (sem furo; começar o fio a 5,7 mm da ponta, `buriedStartZ`).

**Tamanhos (C longo, parede 8 mm) — números do build**

| Cabeça | Metade X × Y × Z (mm)¹ | Na mesa (reta) | Folga na mesa X / Y | Cimento na cavidade² | Com sobra 30 % | Pacotes 40 g | M5 | Encaixe/gesso por metade³ | PETG 100 % por metade³ |
|---|---|---|---|---|---|---|---|---|---|
| 44 | 67 × 36 × 169 | 67 × 169, altura 36 | 56,5 / 5,5 mm | 36,9 cm³ ≈ 43,6 g | ≈ 57 g | 2 | × 65 | ~4,2 h · ~139 g | ~12,0 h · ~400 g |
| 48 | 69 × 38 × 169 | 69 × 169, altura 38 | 55,5 / 5,5 mm | 42,9 cm³ ≈ 50,7 g | ≈ 66 g | 2 | × 65 | ~4,5 h · ~148 g | ~13,2 h · ~439 g |
| 52 | 72 × 40 × 169 | 72 × 169, altura 40 | 54,0 / 5,5 mm | 50,2 cm³ ≈ 59,3 g | ≈ 77 g | 2 (justo) | × 70 | ~4,8 h · ~160 g | ~14,6 h · ~485 g |

¹ Y inclui o pino macho (6 mm). ² Cavidade = positivo inteiro (conferido: vazio fechado − positivo = 0,000 %);
densidade 1,18 g/cm³ não verificada. ³ Estimativa grosseira, não saída de fatiador. As duas metades a 100 %
somam ~0,9 kg de PETG: conferir o carretel.

**Como imprimir o C longo**: igual ao curto (face de partição para cima, sem suporte, PETG), com duas
diferenças. (1) Abrir no Bambu Studio o arquivo **`_mesa.stl`**: já vem deitado, face de partição para cima,
centrado na mesa, com o comprimento (169 mm) no eixo Y da mesa. **Não girar** a peça no plano da mesa. Folga
de 5,5 mm nas pontas e ~55 mm dos lados (checada no build e no teste: mínimo exigido 3 mm). (2) Uma metade por
vez na A1 mini (duas lado a lado não cabem: 2 × 69 + folgas > 180). Imagem da mesa:
`render/C_longo_h48_mesa_ANT.png` (quadro vermelho = 3 mm da borda).

**Bancada (diferenças do passo a passo do curto)**: não há dreno. No passo 2, dobrar o fio sobre o gabarito da
POST e deixar o trecho reto 10–20 mm **mais comprido** que a face distal. No passo 5, deitar o fio no meio-furo
da POST: a ponta reta passa pelo furo da parede distal e sai para fora; afundar o trecho dobrado no cimento
apontando para a cabeça. No passo 6, segurar a ponta de fora alinhada com o eixo enquanto aperta. No passo 9,
cortar o fio rente à ponta com alicate de corte e lixar; aparar os tocos das 5 saídas e dos 4 respiros.

## Testes (`node molde/test/molde_test.mjs`, 29/set/2026)

**174 asserções, 0 falhas** (curto 44/48/52 × 28 Fr + longo 44/48/52), ~2 min 20 s. Para o **C longo**, além das
checagens comuns: 1 componente por metade; **cabe reta na A1 mini** (pegada X × Z com ≥ 3 mm livres de cada
lado: 5,5 mm nas pontas; altura ≤ 180); **cavidade fechada = positivo inteiro** (diferença 0,000 % nas 3
cabeças, limite ±1 %); parede mínima 8,012 mm (na ponta distal); ponta fechada e furo do fio no eixo (centro
< 0,001 mm, raio 1,797 mm); sem tubo, batente nem régua; gravações "C LONGO" + cabeça; pinos dentro da parede
e casados; nenhum respiro/canal na calota (0 mm³); cobertura do fio até o molde 4,14 mm. O trimesh
(código independente) confere as 3 metades longas: 1 corpo, estanque, 0 pontos de cimento dentro do molde,
0 de 6 000 pontos "abraço" faltando, ponta fechada, furo do fio livre, folga na mesa, parede analítica 8,012 mm.
Página: gerada no navegador embutido (Chromium) para "longo" h48 (checagens rápidas OK, molde ~1,3 s) e de volta
"curto" h48 (OK).

### Testes do C curto (27/set/2026, rodados de novo em 29/set)

Para 44/48/52 × 28 Fr (dentro das 174 acima); manifold-3d + conferência independente em python/trimesh:
- cada metade: manifold, **1 componente**, STL com toda aresta em exatamente 2 triângulos, cabe em 180³;
- parede mínima 8,125 / 8,172 / 8,162 mm (limitada pelo furo do pino P2; rodada de 29/set); conferência analítica em python: 8,22 / 8,25 / 8,21 mm;
- cabe reto na mesa: 67–72 × 131 mm, folga 24,5 mm nas pontas;
- fechar as duas metades reproduz a cavidade: vazio fechado − cimento = −0,10 / −0,08 / −0,07 % (as abas do
  batente tiram 31 mm³); 0,00 mm³ de diferença fora das abas; metades espelhadas (diferença 0,000 %);
- pinos: saliência do macho 100 % dentro do furo, 0 mm³ de interferência, eixos coincidentes, furo 0,9 mm mais fundo;
- furo do dreno: centro a < 0,001 mm do eixo da haste em 3 alturas, raio 4,865 mm (Ø9,73); batente em z = 15, 25 mm da face distal;
- respiros e canais: 0 mm³ dentro do cone da calota articular (71,3° + 2 mm de raio); respiros a 80° e 134° do eixo;
- fio: cobertura mínima de cimento 2,07 mm até o molde;
- trimesh (código independente): 1 corpo, estanque; 0 de ~3 300 pontos de cimento dentro do molde;
  6 000 pontos a 0,4 mm fora do positivo todos no molde (1 ponto no 44 caiu dentro do próprio positivo numa
  dobra côncava — artefato da normal, contado à parte); furo do dreno livre; abas presentes; pinos certos.
- Página: gerada e conferida no Chrome headless (SwiftShader): cabeça 48/28 Fr, 52/OD 9,6 e 44/36 Fr,
  checagens rápidas OK, ~1,1 s de molde + 0,6–0,8 s de checagens. O clique de download não foi testado headless.

Detalhe técnico que custou: em manifold-3d 2.5.1, `trimByPlane` em y = 0 deixou uma membrana de espessura
zero atravessando a cavidade (o positivo tem vértices exatamente em y = 0); cortar por **interseção com
caixa** não deixa. `minGap()` deu zero falso num caso; a parede é medida por BVH (vértices + centroides,
nos dois sentidos). O anel de rebarba tocava a si mesmo nos cantos côncavos (arestas com 4 triângulos no
STL); o contorno é fechado (offset + / −) antes.

## Limites e o que NÃO está verificado

- Nada foi impresso. Folga de pino e de dreno são padrões FDM: calibrar com os cupons.
- Calor do cimento no PETG, deformação do molde e aderência ao óleo mineral: só a bancada responde.
- Se o cimento pastoso escoa pelos canais 3 × 3 mm e pelos respiros Ø2: não há número publicado; ver na bancada.
- Espessura da parede do dreno (ID) não é conhecida: as abas avançam 1 mm sobre a parede (`stopLip`).
  Se o dreno tiver parede < 1 mm, a aba pega também o cimento de dentro do dreno — medir o dreno.
- As abas afinam o cimento em volta do fio para 2,07 mm numa faixa de 2 mm logo acima do dreno.
- A linha de partição cruza a calota articular (plano médio-lateral) e as camadas FDM deixam degrau na
  cabeça: acabamento manual necessário; não há inserto polido.
- O gabarito do fio segue o fio do positivo (reto até 62 mm do fim do positivo, dobra de 14°); outro fio,
  outro gabarito.
- OD diferente do positivo (≠ 9,33 mm): a transição dreno→haste é refeita no molde com o mesmo ângulo de 30°;
  com 36 Fr (12 mm) o dreno fica mais grosso que a haste (a página avisa).
- Tempo e massa de impressão: estimativa, não fatiador.
- Uso clínico exige outro material (PA12), esterilização validada e caminho regulatório (ver pesquisa 05/06).

## Arquivos

- `src/params.mjs` parâmetros · `src/positive.mjs` positivo → cimento, calota, respiros · `src/mold.mjs` bloco,
  cavidade, dreno + batente (ou, no longo, ponta fechada + furo do fio), rebarba, respiros, pinos, parafusos,
  fendas, divisão, `bedPose()` (posição de impressão) · `src/labels.mjs` fonte de
  traço e gravações · `src/validate.mjs` checagens · `src/estimate.mjs` impressão e cimento ·
  `src/coupon.mjs` cupons · `src/stl.mjs` · `src/geom.mjs` · `src/node.mjs` (só node) · `src/renders.mjs` (só node).
- `build.mjs` CLI · `index.html` página · `test/molde_test.mjs` + `test/crosscheck.py` testes.
