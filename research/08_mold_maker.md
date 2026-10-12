# 08 — Mold Maker (matta174) e outros geradores de molde: o que dá para reaproveitar

Pesquisa feita em 25/set/2026 para o gerador online de molde do espaçador umeral de cimento
(PMMA com antibiótico). É pesquisa paralela, fora do produto SchulterPlan. O código do
mold-maker foi lido no clone raso do commit `46d0c19f` (20/mai/2026), sem rodar `npm install`.
O que está marcado **NÃO VERIFICADO** não foi confirmado em fonte primária.

---

## 0. Resumo em 10 linhas

1. O **mold-maker** usa React, TypeScript, react-three-fiber e Vite, e tem uma casca Electron
   opcional. A CSG vem de **manifold-3d 3.4.1** (WASM) e roda num Web Worker. O STEP sai por
   `opencascade.js` 1.1.1, que só carrega quando alguém clica em STEP.
2. O pipeline é curto: caixa em volta do modelo → subtrai o modelo → `splitByPlane` → pinos
   (soma numa metade, subtrai com folga na outra) → canal de vazamento e respiros (subtrai) →
   exporta. O mesmo encadeamento serve para o nosso caso.
3. Os valores padrão do código: parede = 8 % da maior dimensão da caixa envolvente; folga de
   0,15 mm; 4 pinos cilíndricos nos cantos, todos machos na metade de cima; canal de vazamento
   cônico 2:1 com boca de 10 mm; 2 a 4 respiros; nenhum ângulo de saída é gerado.
4. **A licença é a PolyForm Noncommercial 1.0.0.** Ela proíbe reaproveitar o código num produto
   ou uso com aplicação comercial prevista. **Recomendação: reaproveitar só as ideias e escrever
   o código do zero (clean-room).** Isto não é parecer jurídico.
5. Hoje o SchulterPlan carrega **manifold-3d@2.5.1** e **three@0.160.0** pelo importmap
   (jsdelivr). Essa carga já funciona no navegador e também nos testes em node.
6. Um spike feito nesta pesquisa, com a mesma versão 2.5.1, gerou um espaçador paramétrico e as
   duas metades do molde. Resultados: gênero 0, estanque no trimesh, interseção entre as metades
   = 0, **0 faces em contrassaída**, de 0,1 a 0,5 s por geração em node.
7. Regra de desenho que o spike confirmou: se toda primitiva for **convexa e simétrica em
   relação ao plano de partição** (hull de esferas ou elipsoides centrados no plano, calota
   esférica cortada por um plano cuja normal está no plano de partição), cada metade sai sem
   contrassaída **por construção**. Não precisa de análise de saída.
8. O plano de partição natural é o **plano coronal do implante**: contém o eixo da haste e o
   eixo do colo, e separa uma metade ANTERIOR de uma POSTERIOR. Isso só vale se a cabeça não
   tiver offset ântero-posterior.
9. O mold-maker não tem o que o molde de cimento precisa: trava ou parafuso para fechar as
   metades, sulco de rebarba, porta para o dreno de tórax, furo para o fio-guia, lubrificação
   prevista, pino macho e fêmea em cada metade. Tudo isso tem de ser escrito.
10. Da técnica de Klosterman (PMC7917196): molde metálico comercial de 2 jigs presos com chave
    hexagonal de 3,5 mm; cimento "runny peanut butter" aplicado por seringa de 60 cc com a ponta
    cortada; óleo mineral em todas as superfícies; fechar e grampear; cura de cerca de 16 min;
    às vezes precisa de impactor de cabeça para tirar a peça.

---

## 1. Fontes consultadas

| # | Fonte | O que foi lido |
|---|---|---|
| 1 | Repositório mold-maker — https://github.com/matta174/mold-maker | Código completo (`src/renderer/mold/*`, `components/ControlPanel.tsx`, `hooks/useMoldGenerator.ts`), README, ROADMAP, ADRs, CONTRIBUTING, PRIVACY, LICENSE |
| 2 | LICENSE do mold-maker (lido na íntegra) — https://github.com/matta174/mold-maker/blob/main/LICENSE | Texto da PolyForm Noncommercial 1.0.0 |
| 3 | Texto canônico — https://polyformproject.org/licenses/noncommercial/1.0.0 e SPDX https://spdx.org/licenses/PolyForm-Noncommercial-1.0.0.html | Confirma o texto |
| 4 | Commit que adicionou a licença — https://github.com/matta174/mold-maker/commit/4e4e1b9d (23/abr/2026) | Justificativa da escolha, troca de `"ISC"` por `SEE LICENSE IN LICENSE` |
| 5 | Página ao vivo — https://matta174.github.io/mold-maker/ | Bundle baixado com curl: `index-*.js` 1,16 MB, `moldWorker-*.js` 158 KB, `manifold-*.wasm` 493 KB (content-length) |
| 6 | Issues do mold-maker — https://github.com/matta174/mold-maker/issues | #3, #4, #6 abertas |
| 7 | Manifold (biblioteca) — https://github.com/elalish/manifold (Apache-2.0) e docs JS https://manifoldcad.org/docs/jsuser/classes/Manifold.html | API, convenção de rotação, gerenciamento de memória |
| 8 | Issue de CSP do manifold — https://github.com/elalish/manifold/issues/1849 e release v3.5.4 https://github.com/elalish/manifold/releases/tag/v3.5.4 | `unsafe-eval`; corrigido na 3.5.4 (25/set/2026) |
| 9 | Tipos do manifold-3d 2.5.1 / 3.4.1 / 3.5.4 via jsdelivr (`manifold-encapsulated-types.d.ts`) | Comparação da API entre as versões |
| 10 | Gerador OpenSCAD de Jason Webb — https://www.thingiverse.com/thing:31581 e blog https://jasonwebb.io/2012/11/parametric-3d-printable-two-part-mold-generator-for-openscad-available-on-thingiverse/ ; cópia do script: https://gist.github.com/jpgreth/bb5b4b86934e40e5373e5d8704b41a40 | Chaves hemisféricas e chave mestra |
| 11 | BOSL2 (OpenSCAD, BSD-2-Clause) — https://github.com/BelfrySCAD/BOSL2/wiki/joiners.scad e https://github.com/BelfrySCAD/BOSL2/wiki/partitions.scad | `$slop`, `snap_pin`, `dovetail`, `partition` |
| 12 | Add-on de Blender — https://github.com/Ruakij/blender-mold-generator (GPL-3.0) | Fatia mais espessa, extrusão, divisão em 2 |
| 13 | splicestl/mold — https://splicestl.com/mold/ | Gerador no navegador sobre Manifold |
| 14 | PrintPal Mold Box Generator — https://printpal.io/tools/mold-box-generator | Gerador no navegador (WASM) |
| 15 | Mold Studio — https://moldstudio.app/ | Comercial, modo "form-fitting" |
| 16 | Action BOX — https://mold.actionbox.ca/ | Análise de plano de partição, STEP |
| 17 | OpenSCAD Playground (WASM, backend Manifold) — https://github.com/ochafik/openscad-wasm , https://fosstodon.org/@OpenSCAD/113256867413539398 | Alternativa de motor |
| 18 | three-bvh-csg — https://github.com/gkjohnson/three-bvh-csg (MIT) | Sem garantia de saída manifold |
| 19 | Klosterman et al. 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/ (HTML baixado e buscado por trechos) | Molde comercial, técnica de enchimento |
| 20 | Espaçador de joelho com molde de silicone vindo de molde FDM de náilon — https://pmc.ncbi.nlm.nih.gov/articles/PMC7884112/ | Autoclave 140 °C/60 min, prensagem |
| 21 | Molde impresso para cimento (relato de caso) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10549869/ | Náilon + titânio, óleo de parafina |
| 22 | Repositório local `gps-espacador` (`test-psi.html`, `js/biorsa/manifoldUtils.js`, `js/humerus/exportRun.js`, `PSI_IMPLEMENTATION.md`, `.vercelignore`) | Como o SchulterPlan carrega e usa o manifold-3d |

---

## 2. O que é o mold-maker

- **Repositório** `matta174/mold-maker`: criado em 16/abr/2026, último push em 20/mai/2026,
  14 estrelas, 3 forks, versão `0.2.0-beta.1`, 33 commits. Nenhuma release estável publicada.
  O GitHub classifica a licença como "Other" porque não reconhece a PolyForm.
- **Produto**: você carrega um STL/OBJ, escolhe um plano de partição e exporta duas metades
  rígidas (casca bipartida) com canal de vazamento, respiros e pinos de registro. Roda no
  navegador (GitHub Pages) ou como app Electron offline.
- O próprio autor corrigiu o posicionamento no ADR-0003
  (`docs/adr/0003-rigid-vs-matrix-mold.md`): a ferramenta faz **casca rígida com cavidade
  direta**, não "molde de silicone". O "matrix mold" (casca mais silicone) foi aceito como
  direção, mas não foi implementado.

### 2.1 Arquitetura

| Camada | Tecnologia | Arquivo |
|---|---|---|
| UI | React 19 + TypeScript (strict), estilos inline | `src/renderer/App.tsx`, `components/ControlPanel.tsx` (1119 linhas) |
| 3D | three 0.183.2 + @react-three/fiber 9 + drei | `components/ModelViewer.tsx`, `PartingPlane.tsx`, `HeatmapOverlay.tsx` |
| CSG | **manifold-3d 3.4.1** (WASM, Apache-2.0) | `mold/manifoldBridge.ts`, `mold/generateMold.ts` |
| Worker | 1 worker de CSG (WASM carregado uma vez e mantido); protocolo com typed arrays transferíveis | `mold/moldWorker.ts`, `mold/workerProtocol.ts`, `hooks/useMoldGenerator.ts` |
| STEP | opencascade.js 1.1.1 (WASM de 65,86 MB bruto / 13,98 MB gzip), worker próprio, carregado no primeiro clique | `mold/stepExporter.ts`, `stepExportWorker.ts`, ADR-0001/0002 |
| Build | Vite 8, `optimizeDeps.exclude: ['manifold-3d']`; Electron Forge para o desktop | `vite.renderer.config.ts`, `forge.config.ts` |
| Testes | vitest (173 testes em 20/abr segundo o ROADMAP) | `*.test.ts` ao lado de cada módulo |
| Telemetria | Opt-in, Umami auto-hospedado, CSP `connect-src` travado | `services/telemetry*.ts`, `PRIVACY.md` |

A CSP do `index.html` inclui `'unsafe-eval' 'wasm-unsafe-eval'`. O comentário no arquivo diz
que o manifold-3d precisa disso. O fato é confirmado pela issue #1849 do manifold: o glue do
embind usa `new Function`. **Corrigido no manifold-3d 3.5.4, publicado hoje, 25/set/2026.**

### 2.2 Pipeline de geração (`generateMold.ts`), na ordem

1. **`validateMesh`**: descarta triângulos com NaN/Infinity, colapsados ou de área < 1e-12, e
   devolve um log de reparo que vira aviso na UI.
2. **`capOpenBoundaries`** (só no modo "hollow vessel"): encontra laços de borda aberta e fecha
   cada um com um leque a partir do centroide.
3. **`geometryToManifold`**: mantém a malha não indexada e informa ao Manifold, por
   `mergeFromVert`/`mergeToVert`, quais vértices coincidem (hash espacial com tolerância 1e-5).
   Em seguida chama `Manifold.ofMesh`. Os erros são classificados em mensagens acionáveis
   ("table index out of bounds" vira "topologia corrompida").
4. **Envelope da caixa** (`moldBox.ts`), com 3 formas:
   - `rect`: caixa envolvente mais a parede em todos os lados;
   - `cylinder`: raio = √((meia-largura A)² + (meia-largura B)²) + parede, com o eixo sempre
     no eixo de partição;
   - `roundedRect`: raio de canto limitado a 0,3 × parede, para os pinos não caírem no
     arredondamento.
5. `caixa.subtract(modelo)` gera a cavidade.
6. **`splitByPlane(normal, offset)`** devolve `[lado da normal, lado oposto]`. O plano pode ser
   inclinado até ±30° em torno de um eixo de charneira fixo (X→Y, Y→Z, Z→X).
7. **Pinos**: `Manifold.cylinder(h, r, r, 16, center=true)` centrado no plano. É somado na
   metade de cima e o soquete (r + folga, h + 2·folga) é subtraído da de baixo.
8. **Canal de vazamento e respiros**: cilindros cônicos subtraídos da metade de cima, do topo
   externo até o plano.
9. **Planos adicionais** (opcional): cada plano corta todas as peças; peças vazias são
   descartadas.
10. **`manifoldToGeometry`** lança `EmptyManifoldError` quando a CSG colapsa em malha vazia.

### 2.3 Parâmetros e valores exatos do código

Fonte: `constants.ts`, `ControlPanel.tsx`, `generateMold.ts` e `channelPlacement.ts`.

| Item | Valor no código | Observação |
|---|---|---|
| Parede | `WALL_THICKNESS_RATIO = 0.08` da maior dimensão da caixa envolvente; slider de 3–20 % (mostrado em mm) | Proporcional ao tamanho da peça, não em mm absolutos (o próprio `constants.ts` admite a dívida) |
| Folga de encaixe | `CLEARANCE_MM = 0.15` (UI 0,05–1,0 mm, passo 0,05) | "FDM tight-fit"; 0,05 para resina e 1,0 para ajuste frouxo, segundo o comentário |
| Pinos: quantidade e posição | 4, nos cantos da caixa envolvente da peça, deslocados 0,7 × parede para fora da peça | Na forma `cylinder`: 4 pinos radiais a 0°/90°/180°/270° |
| Pinos: tamanho | raio 0,3 × parede; altura 0,6 × parede; 16 segmentos | Cilindro reto, **sem chanfro de entrada** |
| Pinos: macho/fêmea | **todos machos na metade de cima** e todas as fêmeas na de baixo | Não há assimetria que impeça montar girado 180° |
| Canal de vazamento | boca Ø 10 mm (UI 4–25 mm, passo 0,5); portão = boca/2 (cone 2:1); raio mínimo 1 mm; 24 segmentos | Posição: centroide ponderado por área da superfície da metade de cima; se cair num vazio (ex.: rosquinha), vai para o triângulo mais próximo; pode ser posto à mão |
| Respiros | 2 a 4; raio = 0,35 × raio do portão; afunilamento 1,2; espaçamento ≥ 0,3 × extensão lateral; amostra até 2000 vértices; margem 0,3 × parede | Postos nos vértices mais distantes do canal. O ROADMAP #14 admite que "é o algoritmo errado": o certo são máximos locais do teto da cavidade |
| Margem do canal até a parede externa | canal: raio + 0,5 × parede; respiro: raio + 0,3 × parede | Evita furar a lateral do molde |
| Altura mínima do canal | 0,25 × parede, senão os canais são omitidos | — |
| Ângulo de saída (draft) | **nenhum é gerado**; só um mapa de calor | verde se n·d > 0,2; amarelo em (0; 0,2]; vermelho se ≤ 0; "contrassaída verdadeira" < −0,05 |
| Auto-detecção do plano | 3 eixos × 19 posições; pontuação = 0,6·equilíbrio + 0,2·centralidade + 0,05 (se Z) + 0,15·extensão − 3,0·fração de contrassaída | Só planos alinhados aos eixos |
| Tolerância de solda | `MERGE_TOLERANCE = 1e-5` | — |
| Vista explodida | 0,3 × maior dimensão | — |
| Escala para a impressora | 10 impressoras predefinidas; aplicada **só na exportação**, num clone | A CSG sempre roda em 1:1 |

### 2.4 Exportação

- **STL binário** com normais, **OBJ** e **3MF** mínimo (um zip escrito à mão em
  `utils/minizip.ts`, com unidade "millimeter"). Todos são escritos por funções próprias sem
  dependência externa.
- **STEP**: casca facetada, 1 face BRep por triângulo, costurada por `BRepBuilderAPI_Sewing`.
  Vem com uma lista longa de armadilhas do opencascade.js (nome de arquivo com mais de
  10 caracteres corrompe a escrita, entre outras).
- Cada peça sai como **um download separado** (`<nome>_<sufixo>.<formato>`), com uma pausa
  entre os downloads para o navegador não bloquear.

### 2.5 Desempenho

- A CSG roda no worker porque "generateMold can hang for several seconds on complex models"
  (comentário em `moldWorker.ts`). A entrada é um STL arbitrário com dezenas ou centenas de
  milhares de triângulos.
- Medido na página publicada: bundle principal de 1,16 MB, worker de 158 KB, `manifold-*.wasm`
  de 493 KB (content-length). O STEP só pesa se for usado.
- **Nenhum `.delete()`** é chamado em objetos Manifold (grep = 0 fora dos testes). O README do
  manifold-3d avisa que objetos WASM não são coletados pelo garbage collector. Como o worker
  vive a sessão inteira, a memória cresce a cada geração. Isto é inferência pela leitura do
  código; não medi no navegador.

### 2.6 Controles da UI

Modelo (abrir, arrastar e soltar, exemplo de "cogumelo"). **Plano de partição**: X/Y/Z,
posição de 0,05 a 0,95, ângulo de corte de 0 a 30°, "Add cut" (planos extras), Auto-Detect.
Modo hollow vessel. Posição manual do canal (passo 0,5 mm). Mapa de saída (draft analysis).
**Mold Box**: rect/cylinder/roundedRect, parede (mm), folga (mm), Ø do canal (mm).
**Printer Fit**: predefinição, escala sugerida e escala manual. **View**: wireframe, vista
explodida, mostrar original. **Export**: STL/OBJ/3MF/STEP. **Privacy**. Atalhos: O, G, A, H,
E, X/Y/Z, W, ?, Esc.

### 2.7 Limitações e problemas conhecidos

- **Só planos de partição**: alinhados aos eixos, ou inclinados até 30° em torno de uma
  charneira fixa. Sem partição por contorno (ROADMAP #8) e sem moldes de 3 ou mais partes
  ("Not Planned").
- A entrada precisa ser estanque; se não for, falha sem recuperação. Não há reparo de malha
  (ROADMAP #9).
- A parede é proporcional à peça: numa peça de 200 mm dá 16 mm de parede; numa de 20 mm, 1,6 mm
  (o próprio `competitive-analysis.md` critica isso).
- **Geometria dos pinos**: o centro do pino fica a 0,3 × parede das faces externas e o raio é
  0,3 × parede. O pino fica **tangente** às duas faces externas do canto, e o soquete
  (r + 0,15 mm) **rompe a parede externa** em cerca de 0,15 mm. Deduzido das constantes e das
  fórmulas de `channelPlacement.ts`/`moldBox.ts`; **NÃO TESTADO** rodando o app.
- Respiros heurísticos, sem chanfro de entrada nos pinos, sem fixação (parafuso/grampo), sem
  sulco de rebarba, sem canal para inserto.
- Sem `.delete()` na WASM (§2.5).
- A CSP exige `unsafe-eval` para o manifold-3d abaixo da 3.5.4.
- **Documentação inconsistente**: `docs/competitive-analysis.md` ainda fala em "MIT-style
  licensing" e "Open source: Yes", mas o `LICENSE` e o README dizem PolyForm Noncommercial.
  O que vale é o `LICENSE`.
- Issues abertas: #3 (atalho Cmd/Ctrl+Enter), #4 (lembrar os últimos valores dos sliders),
  #6 (importar STEP; distorção por tesselação).

---

## 3. LICENÇA: o que o texto permite (lido na íntegra)

O arquivo `LICENSE` é o texto canônico da **PolyForm Noncommercial License 1.0.0**. O commit
`4e4e1b9d` (23/abr/2026) diz que o texto foi copiado literalmente de polyformproject.org.
Nenhuma linha `Required Notice:` existe no repositório: a única ocorrência é o exemplo
"Yoyodyne" dentro do próprio texto da licença. Não há cabeçalhos de copyright nos fontes.
O README acrescenta: uso comercial exige licença separada, com um contato de e-mail listado lá.

O que cada seção concede ou exige:

| Seção | Efeito |
|---|---|
| Acceptance | Usar o software significa aceitar os termos como obrigação e como condição. |
| Copyright License | Licença para fazer com o software tudo o que infringiria o copyright, **somente para um "permitted purpose"**. |
| Distribution License | Pode distribuir cópias, inclusive modificadas, dentro do permitido. |
| Notices | Quem receber qualquer parte do software de você precisa receber também estes termos (ou a URL) e as linhas `Required Notice:` (não há nenhuma). |
| Changes and New Works | Pode modificar e criar obras derivadas **para um "permitted purpose"**. |
| Patent License | Licença das patentes do licenciante que você infringiria ao usar o software. |
| Noncommercial Purposes | "Any noncommercial purpose is a permitted purpose." |
| Personal Uses | Pesquisa, experimento e teste para conhecimento público, estudo pessoal, hobby etc. **"without any anticipated commercial application"**. |
| Noncommercial Organizations | Uso por organização de caridade, instituição de ensino, organização pública de pesquisa, **organização de saúde ou segurança pública**, organização ambiental ou governo é permitido qualquer que seja a fonte de financiamento. |
| Fair Use | Os direitos de fair use continuam valendo. |
| No Other Rights | Não pode sublicenciar nem transferir. |
| Patent Defense | Quem alegar que o software infringe patente perde a licença de patente (e a empresa também). |
| Violations | 32 dias para corrigir depois do primeiro aviso escrito; senão a licença termina. |
| No Liability | Sem garantia e sem responsabilidade. |

**O que isso significa para nós** (leitura técnica, **não é parecer jurídico**):

- O gerador vai ser usado por um cirurgião e desenvolvedor privado, e possivelmente como
  ferramenta ao lado de um produto comercial (SchulterPlan, Vercel, marcas de implante).
  Existe **aplicação comercial prevista**, então copiar, modificar ou redistribuir código do
  mold-maker **não** está coberto.
- A cláusula de "organização de saúde pública" cobre o **uso** por um hospital público. Não
  cobre uma pessoa ou empresa que cria e distribui uma obra derivada para outros fins.
- **Pode**: ler e estudar o código (o que foi feito aqui) e reaproveitar **ideias, algoritmos
  e números de engenharia** (ex.: folga de 0,15 mm, cone 2:1). Copyright protege a expressão,
  não a ideia. Também podemos citar o projeto como inspiração.
- **Não pode**: copiar arquivos ou trechos (`generateMold.ts`, `channelPlacement.ts`,
  `moldBox.ts`, `exporters.ts`, `minizip.ts`), traduzir linha a linha ou fazer fork.
- Entre 16 e 23/abr/2026 o repositório não tinha `LICENSE` e o `package.json` dizia `"ISC"`,
  resto do `npm init`. **Não contar com isso**: valem os termos atuais, e o próprio commit diz
  que o "ISC" era um resíduo.
- Se um dia quisermos o código deles, o caminho é pedir uma licença comercial ao autor.

**Recomendação: clean-room.** Escrever o gerador do zero sobre bibliotecas permissivas:
manifold-3d (Apache-2.0), three.js (MIT) e, se preciso, fflate (MIT) para zip. Nenhuma linha
do mold-maker entra.

---

## 4. Outros geradores e bibliotecas, e o que cada um ensina

| Projeto | Tipo e licença | O que faz | Lição para nós |
|---|---|---|---|
| **Jason Webb, "Parametric two-part mold generator"** (Thingiverse 31581, 2012) | Script OpenSCAD. Segundo o resumo de busca a licença é CC-BY — **NÃO VERIFICADO** na página (o Thingiverse não renderizou) | Caixa quadrada ou circular, modelo subtraído, meias-caixas em Z | **Chaves hemisféricas** centradas no plano: esfera macho r 4,0 mm, fêmea r 4,1 mm (folga de 0,1 mm), 30 segmentos. Mais uma **"chave mestra" cúbica** 6×6×4 mm contra 6,4×6,4×4 (folga de 0,2 mm por lado) que impede montar girado. Chaves macho e fêmea nas **duas** metades (hermafrodita). Furo de vazamento cônico r 2→10 mm, 10 mm de altura. Margem padrão de 10 mm. (Script lido no gist https://gist.github.com/jpgreth/bb5b4b86934e40e5373e5d8704b41a40.) |
| **BOSL2** `joiners.scad` / `partitions.scad` | Biblioteca OpenSCAD, BSD-2-Clause | `dovetail`, `snap_pin`/`snap_pin_socket` (clearance 0,2 e preload 0,2 por padrão), `rabbit_clip`, `partition()` com perfis flat/sawtooth/dovetail/jigsaw | **Uma variável global de folga (`$slop`)** aplicada a todos os encaixes, para calibrar por impressora. **Rabo-de-andorinha cônico** que só trava no fim do curso. Perfil de partição não plano, se um dia for necessário. |
| **Ruakij/blender-mold-generator** | Add-on de Blender, GPL-3.0 | Acha a fatia Z de maior perímetro, corta, extrude o perfil e divide em 2 | A partição pela **maior seção** é o critério clássico. No nosso caso ela é conhecida por construção (o plano coronal do implante). Sem chaves nem canais. |
| **splicestl/mold** | Web, no cliente, "JavaScript + WebAssembly", Manifold (**NÃO VERIFICADO** no código; a página afirma) | Caixa de 2 partes ou 1 parte aberta; eixo de extração X/Y/Z; chaves cilíndricas (Ø e quantidade ajustáveis); canal e respiros ajustáveis; paredes de 3–5 mm (padrão 5); predefinições por material | Mostra que **Manifold + JS estático** basta para um gerador útil. Também a ideia de **predefinições por material** (o nosso seria "PMMA em massa"). |
| **PrintPal Mold Box Generator** | Web, WASM no cliente, grátis | Caixa para silicone; chaves pino e soquete com Ø e altura ajustáveis; canal; respiro; vista explodida; estimativa de volume de silicone | **Estimativa de volume** do material: no nosso caso, cm³ de cimento e número de pacotes. |
| **Mold Studio** | Web, comercial (créditos) | Modos "box", "form-fitting" e "silicone"; núcleo interno; volume em cm³ e g | Um molde **"form-fitting"** gasta menos filamento, mas precisa de orelhas para as chaves (ver o spike, §6). |
| **Action BOX mold** (mold.actionbox.ca) | Web, fechado | Análise de plano, verificação de desmoldagem, STL/OBJ/3MF/STEP; limite de 200 MB | Mapa de saída e STEP viraram o básico esperado. Para nós o STEP não é necessário. |
| **ManifoldCAD.org**, exemplo "Tetrahedron Puzzle" | Editor web do próprio Manifold (Apache-2.0) | Divide um sólido em duas metades idênticas que se rosqueiam, via `warp()` | Mostra o manifold-3d fazendo **peças complementares com folga** no navegador, sem build. |
| **OpenSCAD Playground / openscad-wasm** | OpenSCAD em WASM, backend Manifold | CAD por script no navegador | Alternativa: escrever o gerador em `.scad`. **Não recomendado**: pesado e com UI pronta dele. O JS direto com manifold-3d é mais leve e já é a casa. |
| **three-bvh-csg** | MIT; já está no importmap de `test-psi.html` | CSG rápida sobre BVH | O README avisa que o resultado "may not be correctly completely two-manifold". **Não usar para o STL final**; no máximo para prévia. |
| CadQuery (gist hyOzd) | Python, sem licença declarada | Molde de cavidade única com furos de enchimento | Não serve para o navegador; só confirma o padrão "bloco − peça + furos". |

A comparação de mercado que o próprio mold-maker fez (`docs/competitive-analysis.md`) cita
ainda moldmaker.vercel.app (pago, "contour split") e o Meshmixer (descontinuado). Não verifiquei
essas afirmações.

---

## 5. Como o SchulterPlan carrega o manifold-3d hoje (a versão a usar)

- **Importmap** com a mesma URL do manifold-3d em 9 páginas (`test-psi.html:445`,
  `humerus-psi.html:162`, `index.html:1244`, `reamer.html:464`, `bio-rsa.html:448`,
  `humerus.html:883`, `procedure.html:215`, `xr-demo.html:234`,
  `surgery-dashboard.html:839`). As 24 páginas com 3D declaram three@0.160.0.
  ```
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
  "manifold-3d": "https://cdn.jsdelivr.net/npm/manifold-3d@2.5.1/manifold.js"
  ```
  O glue encontra o `manifold.wasm` ao lado do `.js` no próprio jsdelivr.
- **Inicialização** (`js/biorsa/manifoldUtils.js`, `js/humerus/exportRun.js`, `test-psi.html`):
  ```js
  import ManifoldModule from 'manifold-3d';
  const wasm = await ManifoldModule(); wasm.setup();
  const { Manifold, Mesh, CrossSection } = wasm;
  ```
- **Testes em node** (`test/humerus_psi_cut_guide_test.mjs`, `test/reamer_test.mjs`) usam
  `await import('manifold-3d')`. A versão 2.5.1 instalada está em
  `gps-web-planner Implantcast/node_modules/manifold-3d` (e three 0.160.0 ao lado). O spike
  desta pesquisa usou esse caminho absoluto; o worktree `gps-espacador` não tem `node_modules`.
- **Regras da casa sobre o manifold-3d** (de `PSI_IMPLEMENTATION.md` e dos comentários em
  `manifoldUtils.js`/`exportRun.js`):
  1. Não compor `Manifold.rotate()` a partir de um Euler do THREE. O manifold aplica rotações
     globais na ordem x, depois y, depois z (docs: "equivalent to x-y-z global rotations"), o
     que não bate com `THREE.Euler('XYZ')`. A casa manda **assar a transformação na geometria
     THREE** antes de converter.
  2. `mergeVertices` só solda quando todos os atributos coincidem: tirar normal e UV antes.
  3. O manifold é preguiçoso: **sempre materializar com `getMesh()`** (ou `status`) para ver o
     erro.
  4. Remover triângulos degenerados depois de soldar (um já basta para "Not manifold").
  5. Cilindros finos com muitos segmentos contra uma malha óssea geram *slivers* (o caso do
     fio de Kirschner Ø 2,5 com 96 segmentos).
- **Verificação no spike desta pesquisa**: em 2.5.1, `transform()` com uma **Mat4 de 16
  elementos column-major** aplicou a translação corretamente (cubo → [9..11, 19..21, 29..31]).
  Com um array de 12 elementos (formato mat3x4 do C++) o resultado sai errado. A regra "a 2.5.1
  descarta a translação" pode ter vindo do layout da matriz. **Mesmo assim, manter a regra da
  casa**: o gerador paramétrico nem precisa de rotação, porque tudo sai de `hull` + `translate`
  no referencial canônico.
- **Deploy**: não há `vercel.json` nem CSP definida hoje. `.vercelignore` é uma allowlist
  (`!/*.html`, `!/js`, `!/css`, `!/data`, …). Uma pasta nova `spacer/` **não seria publicada**;
  uma página `spacer.html` na raiz com módulos em `js/spacer/` seria publicada
  automaticamente. Se o gerador for um site separado (GitHub Pages ou outro projeto Vercel),
  nada disso importa. Se entrar neste repositório, vale a regra do `CLAUDE.md`: **regenerar o
  `map/` no mesmo commit**.

### Qual versão usar

| Critério | 2.5.1 (a da casa) | 3.5.4 (a mais nova, 25/set/2026) |
|---|---|---|
| Já provada no navegador e em node neste projeto | **sim** | não |
| `manifold.wasm` (bruto / gzip) | 917 KB / 317 KB | 541 KB / 205 KB |
| Volume e área | `getProperties().volume` | `volume()`, `surfaceArea()` (`getProperties` foi removido) |
| Extras | `hull`, `trimByPlane`, `splitByPlane`, `levelSet`, `smoothOut`, `refine`, `minGap`, `project`, `slice` | os mesmos, mais `minkowskiSum/Difference`, `rayCast`, `refineToTolerance`, `status`, `withContext` (`precision` virou `tolerance`) |
| CSP sem `unsafe-eval` | não | **sim** |

**Recomendação**: começar na **2.5.1**, pela paridade com o SchulterPlan, a carga já provada e
os testes que rodam hoje. Isolar as diferenças numa camada fina (`volumeOf(m)` etc.). Migrar
para a 3.5.4 quando a CSP ou o tamanho do WASM importarem. Para uso sem internet no hospital,
**hospedar localmente** `manifold.js` + `manifold.wasm` + three (Apache-2.0 e MIT permitem
redistribuir com o aviso de licença), em vez de depender do jsdelivr.

---

## 6. Spike de viabilidade (feito nesta pesquisa, números ilustrativos)

Scripts temporários (não versionados e não publicados): `spike.mjs`
e `spike2.mjs`. Rodam em node 22 com manifold-3d 2.5.1. Os STLs gerados
(`spacer.stl`, `mold_ant.stl`, `mold_post.stl`) estão na mesma pasta. **As medidas anatômicas
são de teste, não são referência** (cabeça Ø 50 × 19 mm, CCD 135°, haste Ø 11 mm).

Como foi construído:
- **Referencial canônico**: +Z proximal no eixo da haste, +X medial, Y = AP (normal do plano de
  partição). No spike2 a normal ficou em Z para usar `project()` e `slice()`.
- **Haste**: `hull` de duas esferas (uma cápsula).
- **Corpo proximal**: `hull` de esferas achatadas (elipsoides), todas centradas no plano. Sai
  convexo e robusto, sem aletas nem furos.
- **Colo**: `hull` de duas esferas ao longo do eixo do colo, inclinado 180° − CCD em relação à
  haste. Sem cone Morse: é um pescoço maciço de cimento.
- **Cabeça**: `Manifold.sphere(R, 192)` cortada por `trimByPlane(n, d)` no plano de ressecção
  (normal = eixo do colo), dando a calota de altura h.
- **Molde**: `cube` (ou contorno com `project().offset(parede)` + `extrude`) → `subtract` →
  `splitByPlane([0,1,0], 0)` → chave 1 macho na ANT e fêmea na POST, chave 2 o inverso →
  respiro no ápice da cabeça.

Resultados:

| Medida | Spike 1 (caixa, esfera com 96/48 segmentos) | Spike 2 (contorno, cabeça com 192 segmentos) |
|---|---|---|
| Carga do WASM (node, arquivo local) | 14 ms | — |
| Construir o espaçador | 94 ms | 406–468 ms |
| Molde + divisão + chaves | 36 ms | 326–533 ms |
| Triângulos: espaçador / metade | 10 012 / ~5 150 | 11 318 / ~6 600 |
| Gênero, estanqueidade (trimesh), interseção ANT∩POST | 0, estanque, 0,000 mm³ | 0 (parede de 8 mm) |
| Faces do espaçador em contrassaída (n·y < −0,02 no lado +y, ou o inverso) | **0** | — |
| Volume de cimento (parte proximal) | — | 33,7 cm³ |

Lições do spike:
1. **Não há contrassaída por construção.** Toda primitiva é convexa e simétrica em relação ao
   plano de partição, então qualquer reta normal ao plano corta cada primitiva num intervalo
   centrado no plano. A união de intervalos que contêm o plano é um intervalo que contém o
   plano, logo cada metade é "monótona" na direção de extração. Condição: **a cabeça não pode
   ter offset AP**, só medial e superior no plano coronal.
2. **Tempo de 0,1 a 0,5 s por geração**. Dá para rodar no fio principal com *debounce*. Um
   worker é opcional, só se a UI travar. Duas resoluções ajudam: prévia com 48–96 segmentos e
   exportação com 192.
3. **As chaves precisam de parede.** Com parede de 6 mm e chave Ø 6 não há faixa livre entre a
   cavidade e a face externa. Com 8 mm a faixa tem 3 mm² e sobra 1,2 mm até a cavidade; com
   12 mm, 733 mm² e 4,2 mm. Portanto: caixa retangular (sobra material nos cantos), ou molde
   de contorno **com orelhas** onde ficam as chaves.
4. **A checagem de gênero pegou um erro real**: com parede de 12 mm uma chave caiu fora do
   bloco (o bloco tinha sido cortado em Y e a faixa não) e virou um pino solto. O
   gênero = −1 (2 componentes) denunciou. Os testes do gerador devem exigir 1 componente por
   metade.
5. Na 2.5.1, `CrossSection.toPolygons()` devolve `{x, y}`, não `[x, y]`. Com `[i]` sai NaN, e
   `translate(NaN)` faz a WASM lançar um número (um ponteiro de exceção C++) sem mensagem.

---

## 7. REAPROVEITAR × ESCREVER (página estática, sem build: HTML + importmap + three + manifold-3d)

### 7.1 Reaproveitar (código com licença permissiva ou do próprio usuário)

| Peça | Origem | Licença |
|---|---|---|
| three@0.160.0: cena, `OrbitControls`, **`STLExporter`** (binário), `BufferGeometryUtils` | jsdelivr, como no SchulterPlan | MIT |
| manifold-3d@2.5.1: `sphere`, `cylinder`, `cube`, `hull`, `trimByPlane`, `splitByPlane`, `union/subtract`, `project`/`CrossSection.offset`/`extrude`, `minGap`, `genus`, `getProperties` | jsdelivr, como no SchulterPlan | Apache-2.0 |
| `initManifoldEngine`, `manifoldToGeom`, `manifoldCheck` (contagem de arestas), `meshVolumeMm3` | `js/biorsa/manifoldUtils.js` do próprio repositório | do usuário. Dentro do repo: **importar, não copiar** (o `CLAUDE.md` proíbe fork por cópia). Num site separado: copiar com referência. |
| Zip de vários STLs num download (opcional) | fflate | MIT |
| Padrão de teste em node (`import('manifold-3d')` e checagens) | `test/humerus_psi_cut_guide_test.mjs` | do usuário |

### 7.2 Reaproveitar só como ideia (sem copiar código)

- **Do mold-maker**: a ordem do pipeline; pino **centrado no plano** (metade dele em cada
  lado); soquete = pino + folga no raio e 2 × folga na altura; **folga em mm absolutos com
  padrão de 0,15 mm** (FDM justo), numa faixa ajustável; canal cônico 2:1; checar que o canal
  cai sobre a cavidade; erro tipado quando a CSG sai vazia; classificar os erros do WASM em
  mensagens úteis; exportar por peça; vista explodida; aviso de "cabe na impressora"; mapa de
  saída (desnecessário se o desenho for simétrico e convexo).
- **Do Webb**: chaves **hemisféricas** (autocentrantes, imprimem bem) e **chave mestra
  assimétrica** contra a montagem invertida.
- **Do BOSL2**: **folga única global calibrável** (`$slop`) e **chanfro ou cone de entrada**
  nos pinos.
- **Do PrintPal e do Mold Studio**: **estimativa de volume** de material; molde de contorno
  com orelhas.

### 7.3 Escrever (específico do espaçador)

1. **`spacerModel.js`**, parâmetros → sólido. Haste distal curta dentro do molde (o resto é o
   dreno de tórax), corpo metafisário (hull de elipsoides), pescoço maciço, calota esférica.
   Tudo simétrico no plano coronal, com `hull` + `translate` e sem `rotate`/`transform`.
2. **`moldModel.js`**, sólido → 2 metades.
   - Bloco (caixa, ou contorno com orelhas) → `subtract(espaçador)` →
     `splitByPlane(normal AP)` → nomes **ANT** e **POST**.
   - **Chave 1 macho na ANT e fêmea na POST; chave 2 o inverso**, em posições assimétricas
     (ex.: proximal-lateral e distal-medial) para impedir montagem girada.
   - Cilindro com chanfro (ou hemisfera). Folga ajustável: 0,2–0,4 mm como ponto de partida
     para FDM, a calibrar numa impressão de teste. **NÃO VERIFICADO** para PMMA.
   - **Porta distal** coaxial à haste, com Ø = Ø externo do dreno de tórax + folga (ver §8),
     para encaixar e centralizar o dreno ou deixar o fio-guia de 2,5 mm sair.
   - **Respiro** no ápice da cabeça (Ø 2–3 mm).
   - **Sulco de rebarba** opcional em volta da cavidade na face de partição, para o excesso
     de cimento sair e as faces fecharem por completo (prática de moldagem por compressão;
     **NÃO VERIFICADO** nesta pesquisa).
   - **Furos de parafuso** (M4/M5 passante com alojamento de porca) ou faces para grampo.
   - **Gravação** "ANT"/"POST", o tamanho e o lado.
3. **Validações**, bloqueando a exportação se falharem: gênero 0 e 1 componente por metade;
   ANT ∩ POST = 0; `minGap(chave, espaçador) ≥ margem`; espessura mínima de parede;
   volume da cavidade ≈ volume do espaçador; nenhuma face em contrassaída (checagem de
   segurança, mesmo com a garantia por construção).
4. **UI mínima**: Ø e altura da cabeça, tamanho do corpo proximal (largura ML, espessura AP,
   altura), CCD, comprimento e Ø do pescoço, calibre do dreno em French, parede, folga →
   reconstrução com debounce → 3 STLs (espaçador para conferência, ANT, POST) mais um JSON
   com os parâmetros, para reproduzir.
5. **Liberar memória WASM** (`delete()`) dos intermediários a cada regeneração, que é o que o
   mold-maker não faz.
6. **Testes em node** (`test/spacer_mold_test.mjs`) com a 2.5.1: as checagens do item 3 numa
   grade de tamanhos.

---

## 8. O que a técnica de referência pede do molde (PMC7917196, lido no HTML)

- Molde comercial: "Aequalis Ascend Flex Convertible Shoulder System Molds" (Wright Medical).
  Jigs de haste (tamanhos 2, 4, 6, 8) e de cabeça (43 × 16, 48 × 18 e 52 × 23 mm) são
  **presos com chave hexagonal de 3,5 mm**. Material do molde: o texto não descreve (**NÃO
  VERIFICADO**).
- Cimento Palacos (2 pacotes, podendo ser 3 na primeira vez) na consistência de "runny peanut
  butter". Cerca de 15 cc vão para o dreno por **seringa de 60 cc com a ponta cortada**.
  **Cada metade do molde é enchida aberta**, sem encher o cone mais distal. O fio-guia de
  2,5 mm com ponta em bola é deitado na haste de uma das metades, e a bola acaba dentro da
  cabeça. Ele sai distalmente para dentro do dreno. Depois: **fechar e grampear**.
- O dreno é centralizado no molde articular. Drenos de 24–34 F. **Óleo mineral** em todas as
  superfícies ("crucial" para tirar a peça). Cura de cerca de 16 min. Pode precisar de um
  **impactor de cabeça** para soltar a peça do molde. A sobra é aparada com cortador de
  parafuso e lima.
- Conversão de calibre: o texto diz "3 millimeters = 1 French Gauge". A convenção usual é o
  inverso: 3 Fr = 1 mm, ou seja, Ø externo (mm) = Fr/3. Então 24–34 F ≈ 8,0–11,3 mm. A
  conferência do texto original fica com a pesquisa clínica (**NÃO VERIFICADO** aqui).
- **Consequências para o gerador**:
  - encher as metades **abertas** e fechar com cimento dentro. Isso pede chaves com entrada
    fácil (chanfro ou hemisfera), fixação por parafuso ou grampo, escape para o excesso e
    superfícies lisas com óleo;
  - uma porta distal com o calibre do dreno em French;
  - o canal de vazamento do mold-maker **não é o fluxo principal**; no máximo, uma porta
    opcional para seringa.
- Outros relatos: molde de silicone feito a partir de molde FDM de náilon, **autoclavado a
  140 °C por 60 min**, com cimento "injected and pressed" (PMC7884112); molde impresso em
  náilon com peças de titânio e **óleo de parafina** como desmoldante (PMC10549869).
  Material e esterilização de um molde impresso direto em PLA/PETG ficam **NÃO VERIFICADOS**:
  a exotermia do PMMA e a deformação térmica do polímero são tema de outra nota.

---

## 9. Perguntas em aberto

1. Material do molde e esterilização: PLA, PETG, náilon ou resina? Autoclave, EtO ou plasma
   de H₂O₂? Qual temperatura de pico do PMMA o molde aguenta? Define a parede mínima e se o
   molde é descartável.
2. Folga das chaves e acabamento com PMMA em massa, com óleo mineral: 0,15 mm (padrão do
   mold-maker), 0,1 mm (Webb) ou mais? Só uma impressão de teste responde.
3. Enchimento aberto e prensado (como Klosterman) ou fechado com seringa (porta e respiro)?
   Muda o desenho das portas e do sulco de rebarba.
4. Onde a haste proximal do molde termina: fica um cone distal para o dreno, como no molde
   comercial, ou só uma porta cilíndrica?
5. Offset da cabeça: só no plano coronal (garante a ausência de contrassaída) ou o cirurgião
   quer offset posterior? Neste caso o plano de partição precisaria passar pelo centro da
   cabeça, e a simetria do corpo se perde.
6. Onde o gerador mora: página no repositório do SchulterPlan (publicada automaticamente pela
   allowlist e sujeita ao `map/`) ou um site estático separado?
7. Migrar para a manifold-3d 3.5.4 (CSP sem `unsafe-eval`, WASM 40 % menor) já na primeira
   versão, ou ficar na 2.5.1 por paridade?
8. Vale incluir STEP? Provavelmente não: STL basta para imprimir, e o OCCT pesa 14 MB gzip.
