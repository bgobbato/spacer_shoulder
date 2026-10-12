# Positivos do espaçador umeral (PMMA + antibiótico)

## Para que serve
Gera o **positivo**: o sólido fechado (STL) do espaçador de úmero para a revisão em 2 tempos
de artroplastia de ombro infectada. O gerador de molde (`../molde/`) transforma esse STL em molde de duas metades para imprimir na Bambu Lab A1 mini.

Todos os modelos são só a **parte proximal** (cabeça + corpo + haste curta). A haste distal é um
**dreno de tórax** cheio de cimento (com fio de aço Ø3,2 dentro), encaixado no acoplamento em z = 0–15.
Assim a peça moldada cabe na impressora pequena e o comprimento total vem do corte do dreno.

## Contrato de eixos (igual ao da lib de molde)
- Unidade mm. Eixo da haste = **+Z**; ponta distal em **z = 0**; cabeça no topo.
- Cabeça inclinada no plano XZ para **+X = MEDIAL** (β = 180° − NSA; NSA padrão 135°).
- **Y = ântero-posterior.** Sólido simétrico em y = 0; **y = 0 é o plano de partição**;
  desmoldagem em **±Y** (metade anterior y > 0, posterior y < 0). Mesmo sólido para ombro D e E.
- Toda reta paralela a Y cruza o sólido num intervalo único que contém y = 0 (validado a cada build).
- **Furos de sutura** (B e C, 3 × Ø2,5) atravessam em Y: o molde precisa de **pinos-macho** neles.
  Posições em `meta.holes` do JSON (`x`, `z`, `r`).
- **Acoplamento do dreno**: cilindro Ø = Fr/3 em x = y = 0, z 0–15 (`meta.tube`). É espaço do dreno,
  não cimento.
- **Fio de aço (núcleo)**: não é subtraído do sólido. Polilinha no JSON:
  A `meta.coreWire.polyline` · **B `meta.core.polyline`** · C `meta.coreWire.polyline` (C dobra 14° para a cabeça).

## Como gerar
**Padrão (12/out/2026): C longo, cabeça 52, sem dreno.** `node build.mjs` sem argumentos gera
`stl/C_longo_h52.*` (= `--model C --head 52 --variant long`). O C curto + dreno precisa de `--variant short`.
```
cd positivo
node build.mjs                                   # padrão: C longo, cabeça 52
node build.mjs --model all --head 44,48,52 --variant short   # A, B e C curto + dreno, ~70 s
node build.mjs --model C --head 48 --variant short --set tubeFr=32,nsDeg=130
node compare_sheet.mjs                           # refaz render/COMPARACAO.png (lê stl/*_h48.stl)
node build.mjs --model C --head 44,48,52 --variant long   # C longo, sem dreno (stl/C_longo_h<D>.*)
# --variant só mexe no C; A e B ignoram.
node compare_curto_longo.mjs                     # render/COMPARACAO_C_curto_longo.png (cabeça 48)
```
Saída: `stl/<M>_h<D>.stl` + `.json` (pasta **ignorada pelo git** neste repositório: as cópias publicadas ficam em `../stl/positivos/`) (parâmetros, meta, validação), `render/<M>_h<D>_*.png`.
O build sai com código ≠ 0 se qualquer checagem falhar. Variantes prontas em `variants/`.
Documentação de cada modelo em `docs/modelA.md`, `docs/modelB.md`, `docs/modelC.md`.

## Modelos × cabeça (rebuild de 26/set/2026 — os 9 passam)
PMMA assumido 1,18 g/cm³; pacote de 40 g contado como 40 g de cimento (sem perda). "Peça" = comprimento
moldado em Z; o dreno soma o resto. Espessura mínima exigida ≥ 6 mm (a mínima medida fica ao lado
de furo ou da cintura do acoplamento).

| Modelo | Cabeça | Volume cm³ | Cimento g | Pacotes 40 g | Peça (Z) mm | Esp. mín. mm |
|---|---|---|---|---|---|---|
| A colher | 44 | 27,00 | 31,9 | 1 | 90 | 6,54 |
| A colher | 48 | 32,68 | 38,6 | 1 | 90 | 6,66 |
| A colher | 52 | 39,36 | 46,4 | 2 | 90 | 6,22 |
| B anatômico | 44 | 43,90 | 51,8 | 2 | 115 | 6,52 |
| B anatômico | 48 | 51,04 | 60,2 | 2 | 115 | 6,52 |
| B anatômico | 52 | 59,77 | 70,5 | 2 | 115 | 6,52 |
| C cogumelo | 44 | 32,31 | 38,1 | 1 | 110 | 6,26 |
| C cogumelo | 48 | 38,29 | 45,2 | 2 | 110 | 6,26 |
| C cogumelo | 52 | 45,60 | 53,8 | 2 | 110 | 6,26 |

Comprimento total do construto = peça + dreno fora da peça (A padrão: 110 curto / 150 longo;
ajustar pelo corte do dreno). Cimento dentro do dreno não está no volume.
Todos: 1 componente, genus = nº de furos, 0 retas de desmoldagem falhando, simetria ≤ 0,03 mm,
desvio da esfera ≤ 0,01 mm, sem vinco. Comparação visual (cabeça 48, mesma escala): `render/COMPARACAO.png`.

## C longo, sem dreno (variante de 29/set/2026)

Pedido do cirurgião: uma segunda versão do C, **peça única de cimento, sem dreno de tórax**. O C curto + dreno
continua igual (STL do C curto conferido byte a byte depois da mudança).

- Parâmetro em `src/models/modelC.mjs`: `distal: 'tube' | 'long'` (padrão `'tube'`) e `longLen` (padrão 150).
  Na linha de comando: `--variant long` (= `--set distal=long`). Arquivos: `stl/C_longo_h<D>.stl|.json`.
- **Comprimento total 150 mm** (ponta distal → topo da cúpula). **É o limite da mesa da A1 mini**: a metade do
  molde tem 150 + 8 (parede distal) + 11 (margem de cima) = 169 mm e precisa imprimir **reta** em 180 mm, com
  folga. Por isso a haste cresceu 40 mm, não 50. `longLen` aceita 120–150; acima de 150 o build recusa.
- Mesma cabeça, colo, aleta e corpo do C curto, só 40 mm mais altos. A haste tem **a mesma espessura**: o cone
  proximal (Ø 11,5 → 12) é o mesmo e, abaixo dele, a haste segue **reta em Ø 11,5** até uma **ponta em
  meia-esfera** (raio 5,75). Sem espiga, sem ressalto, sem degrau. `meta.distal` descreve a haste e a ponta.
- **Fio de aço Ø3,2**: continua desejável. `meta.coreWire.polyline` vai da ponta (z = 0) pelo eixo até a origem
  do colo e dobra 14° para a cabeça (cabeça 48: `[[0,0,0],[0,0,102],[7.58,0,132.32]]`). Cobertura de cimento
  **4,1 mm** em toda a haste (raio 5,75 − 1,6); a regra de 4 mm vale de z = 5,7 para cima (`buriedStartZ`:
  começar o fio ali, se quiser o fio todo enterrado). O sólido continua **cheio** (o fio não é subtraído).
- Validações iguais às do C curto, todas passando: 1 componente, genus 0, 0 retas de desmoldagem em Y falhando,
  espessura mínima ≥ 6 mm (medida 8,0), desvio da esfera da cabeça ≤ 0,01 mm, sem vinco.

| C longo | Volume cm³ | Cimento g (1,18 g/cm³) | Pacotes 40 g | Com sobra de 30 % (técnica aberta) | Peça (Z) mm |
|---|---|---|---|---|---|
| 44 | 36,95 | 43,6 | 2 | 56,7 g → 2 pacotes | 150 |
| 48 | 42,93 | 50,7 | 2 | 65,9 g → 2 pacotes | 150 |
| 52 | 50,24 | 59,3 | 2 | 77,1 g → 2 pacotes (justo) | 150 |

Sem o dreno, **todo o cimento está no molde** (no C curto, o cimento dentro do dreno ficava fora da conta).
Densidade do PMMA com antibiótico **não verificada**: pesar a primeira peça.
Imagens: `render/C_longo_h48_front.png` (e `_sheet`), `render/COMPARACAO_C_curto_longo.png` (curto × longo,
mesma escala, cabeças alinhadas).

## Como virar molde
Use o gerador de molde deste repositório, `../molde/` (README de lá). O antigo `moldapp` (OpenCode) e a
`lib` de molde **não são publicados aqui**: estão congelados e tinham defeitos (ver `../review/AVALIACAO_FABLE.md`).
As menções a eles nesta pasta são históricas.

## Perguntas em aberto para o cirurgião
1. **Qual arquétipo levar adiante?** (a) A colher: menos cimento (1 pacote em 44/48), sem furos de sutura;
   (b) C cogumelo com aleta: 3 furos para reinserir o manguito, haste cabe em fresa de 12 mm até 40 mm
   abaixo do corte. B é o mais anatômico mas pesado (60 g em 48) e haste de 13,3 mm.
   **Recomendação: C**, com A como alternativa quando não houver manguito para suturar.
2. **Como abrir o furo do dreno no molde?** (a) parte negativa `B_tube_bore_<Fr>Fr.stl` no Bambu Studio
   antes de fatiar; (b) furar à mão após imprimir. **Recomendação: (a)** — repetível, sem broca no PLA.
3. **Tamanho do dreno?** (a) 28 Fr (padrão; haste cabe em fresa de 12 mm; cimento dentro do dreno ~6,7 mm,
   quem segura é o fio de aço); (b) 32 Fr (cimento interno ~8 mm, cobertura do fio melhor, mas C avisa haste
   > 12 mm). 24 Fr é recusado em A (cintura < 8 mm). **Recomendação: 28 Fr** e medir o diâmetro interno
   do dreno real.
4. **Batente do dreno em B e C?** (a) marcar 15 mm no dreno e posicionar com o molde aberto (como está);
   (b) cone de parada como em A (estreita o pescoço de cimento). **Recomendação: (a)** — marcar 15 mm
   com caneta e conferir antes de fechar o molde.
