# 06 — Enquadramento regulatório e responsabilidade: molde impresso para espaçador umeral de PMMA com antibiótico

> **Não é parecer jurídico.** São notas de pesquisa para orientar decisões de projeto e a conversa
> com a diretoria técnica do hospital, a vigilância sanitária e um advogado. Pesquisa feita em
> 25/set/2026. Onde está escrito **NÃO VERIFICADO**, não consegui confirmar na fonte primária.

## TL;DR (o que importa para o cirurgião)

1. **No Brasil não existe isenção para fabricação dentro do hospital** equivalente à do art. 5(5) do
   MDR europeu. Li a RDC 925/2024, a RDC 751/2022 e a RDC 665/2022 e nenhuma delas tem esse tipo de
   isenção. A única exceção "profissional" da RDC 925 vale para prótese dentária feita por profissional
   habilitado (art. 1º, par. único). Imprimir um molde e entregá-lo ao campo cirúrgico tende a
   caracterizar **fabricação de produto para saúde** (Lei 6.360/76, art. 25; Lei 6.437/77, art. 10, IV).
2. **A RDC 305/2019 foi revogada.** A norma vigente é a **RDC 925, de 19/set/2024**, com as mesmas três
   categorias: *sob medida*, *paciente-específico* e *adaptável*. Quem fabrica um dispositivo sob medida
   precisa de **AFE + licença sanitária + BPF**. Nas **classes I/II** não há petição à Anvisa para cada
   peça, mas é obrigatório manter um **dossiê por dispositivo** (art. 11).
3. **Um gerador paramétrico** ("dimensionamento com base em referências anatômicas") se encaixa
   literalmente na definição de **paciente-específico** (RDC 925, art. 2º, IV), e essa categoria exige
   notificação ou registro do fabricante. Para ser *sob medida*, o projeto precisa sair de uma
   **prescrição do cirurgião com características de projeto sob a responsabilidade dele**. O gerador
   deve portanto produzir uma **ficha de prescrição assinável**.
4. **A esterilização no hospital é o ponto mais frágil:** a RDC 15/2012, art. 9º, diz que o CME
   "só pode processar produtos para saúde regularizados junto à Anvisa".
5. **Nos EUA, molde de espaçador é produto regulado:** há 12 moldes com 510(k), todos **classe II**,
   quatro deles de ombro. São regulados junto com o cimento (código MBB, 21 CFR 888.3027) e contam como
   produto combinado. O molde StageOne de hemi-ombro (K160071) é de silicone médico, estéril, uso único,
   indicado apenas com Palacos R+G ou Refobacin R e por no máximo 180 dias.
6. **O cimento com antibiótico em dose alta, misturado à mão, é uso off-label** e fica sob
   responsabilidade do médico (Parecer CFM 2/2016). A receita de Klosterman 2021 (2 envelopes de Palacos
   + 4,0 g de vancomicina + 7,2 g de tobramicina) é exatamente esse tipo de uso.
7. **Documentação mínima:**
   - ficha de projeto assinada, com versão do gerador e hash do STL;
   - registro de fabricação e de esterilização de cada caso;
   - TCLE específico, que diga que o molde não tem registro e que o cimento está em uso off-label;
   - rastreabilidade do cimento e do antibiótico no prontuário, guardada por pelo menos 20 anos.

---

## 1. Quatro objetos, quatro situações regulatórias

| Objeto | É dispositivo médico? | Brasil (minha leitura) | EUA | UE |
|---|---|---|---|---|
| **Gerador web** (software) | Pode ser, se oferecido a terceiros para projetar dispositivo de um paciente | SaMD possível (RDC 657/2022). Uso pessoal como ferramenta de projeto reduz a exposição | Sem política específica. O documento de discussão de POC trata software e arquivos como parte de um "MDPS" | NÃO VERIFICADO |
| **Molde impresso** | Sim, pela definição ampla ("instrumento… material… destinado a… tratamento") | Classe I (não invasivo, Regra 1) ou II; em caso de dúvida, a Anvisa decide (RDC 751, art. 5º, §2º). **Confiança baixa** | **Classe II**, regulado com o cimento (MBB), produto combinado | NÃO VERIFICADO. Lógica da nota 8 do MDCG 2021-3: material destinado a CMD implantável classe III → classe III |
| **Espaçador moldado** (implante temporário) | Sim | Espaçador pré-formado: Regra 8(h) (prótese articular) → IV, e Regra 14 (substância medicamentosa) → IV. Espaçador moldado à mão = ato profissional com produto registrado usado fora da bula | O espaçador formado no molde é o "produto" avaliado no 510(k) (ensaio mecânico + eluição) | Regra 8 (prótese articular → III) + Regra 14 (medicamento → III) |
| **Cimento + antibiótico** | Cimento registrado; o antibiótico acrescentado é medicamento | Adicionar antibiótico em dose alta = off-label, responsabilidade do médico | ALBC comercial liberado apenas para o segundo tempo | Uso fora da finalidade → normas nacionais |

---

## 2. Brasil (Anvisa, CFM, legislação)

### 2.1 Definições que decidem o caso — RDC 925/2024 (em vigor desde 24/09/2024)

Texto primário: [RDC 925/2024 — AnvisaLegis](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=RDC&numeroAto=00000925&seqAto=000&valorAno=2024&orgao=RDC%2FDC%2FANVISA%2FMS&cod_modulo=310&cod_menu=8542). A RDC 925 revoga a RDC 305/2019 e a RDC 562/2021 (art. 20).

- **Sob medida** (art. 2º, III): *"destina-se, exclusivamente, ao uso por um indivíduo em particular,
  fabricado especificamente de acordo com a prescrição de um profissional de saúde habilitado, que
  confere características específicas de projeto sob sua responsabilidade…"*
- **Paciente-específico** (art. 2º, IV): *"tornado compatível… com a anatomia de um paciente usando
  técnicas de dimensionamento com base em referências anatômicas… tipicamente produzido em lote por
  meio de processo passível de ser validado e reproduzido, sob responsabilidade do fabricante"*.
  → **É a descrição exata de um gerador paramétrico.** Paciente-específico e adaptável seguem a
  regularização da RDC 751 (art. 3º): notificação nas classes I/II, registro nas III/IV.
- **Adaptável** (art. 2º, V): produzido em massa e ajustado ou moldado no local de atendimento
  *"de acordo com as instruções validadas do fabricante"*.
  → Cimento moldado **seguindo a bula** seria adaptável. Moldado com antibiótico extra, fora da bula,
  não é.
- **Obrigações do fabricante de sob medida:**
  - AFE + licença sanitária local (art. 5º);
  - requisitos essenciais da RDC 546/2021 (art. 6º);
  - classes I/II: cumprir BPF (art. 8º);
  - classes III/IV: Certificado de BPF, anuência e notificação por peça (arts. 7º, 9º e 10), e o
    fabricante precisa ter registro de produto em escala comercial com a mesma indicação (art. 9º, II).
- **Dossiê por dispositivo (art. 11, todas as classes):**
  - laudo do prescritor (CRM, nome e CPF do paciente, CID, justificativa frente às alternativas
    registradas);
  - exames de imagem;
  - Termo de Responsabilidade e Esclarecimento (Anexo I);
  - fluxograma de fabricação;
  - desenho técnico com dimensões, tolerâncias, acabamento e material com a norma técnica;
  - BPF e rótulo.
- **Prazo de guarda do dossiê:** **15 anos** para implantável e **5 anos** para não implantável
  (art. 11, §§1º e 2º).
- **Rótulo** (art. 14): iniciais do paciente, prescritor + número no conselho, número de rastreio,
  número do expediente (quando houver) e a expressão "dispositivo médico sob medida".
- **Descumprimento = infração sanitária** (Lei 6.437/77), sem prejuízo da responsabilidade civil e
  penal (art. 19).
- O Anexo I (termo que o médico assina) traz a frase: *"informei ao paciente… que este produto não
  possui registro no Brasil, portanto não possui a sua segurança e eficácia avaliada pela Anvisa"*.
  É um bom modelo para o TCLE.

**Perguntas e respostas da Anvisa:**
- A versão da RDC 925 está **"em revisão"** desde 04/07/2025 ([PDF gov.br](https://www.gov.br/anvisa/pt-br/setorregulado/regularizacao/produtos-para-saude/informes/perguntas-e-respostas-dispositivos-medicos-personalizados.pdf)).
- A versão da RDC 305 ([arquivo da Wayback, jan/2021](http://web.archive.org/web/20210115135559/http://antigo.anvisa.gov.br/documents/33912/5644666/Perguntas+e+respostas+-+Dispositivos+m%C3%A9dicos+personalizados/e6cba682-dffc-4343-a9e1-dcfdb8f52a06))
  tinha exemplos úteis:
  - **"Guias cirúrgicas"** aparecem como **paciente-específico**;
  - **"Cimentos ósseos utilizados no reparo ósseo de defeitos craniofaciais"** aparecem como
    **adaptável**;
  - Pergunta 7: para sob medida **classes I e II**, *"não será necessário protocolar anuência ou
    notificação"*; o fabricante mantém o dossiê e precisa de LF, AFE e BPF.

### 2.2 Classificação e definição de dispositivo — RDC 751/2022 (em vigor desde 01/03/2023)

[RDC 751/2022 — AnvisaLegis](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000751&seqAto=000&valorAno=2022&orgao=RDC%2FDC%2FANVISA%2FMS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true)

- **Definições:**
  - dispositivo médico (art. 2º, X): *"qualquer instrumento… material ou outro artigo… destinado… a
    ser usado… em seres humanos"* com finalidade médica;
  - acessório (art. 2º, I).
- **Acessórios são classificados por si mesmos** (art. 8º, §2º).
- **Regras relevantes:**
  - Regra 1: não invasivo → classe I;
  - Regra 6: cirurgicamente invasivo transitório → II; instrumento cirúrgico reutilizável → I;
  - Regra 8: implantável → III; **prótese articular total ou parcial → IV**;
  - Regra 14: incorpora substância que seria medicamento → **IV**.
- Classes I/II → notificação; III/IV → registro (arts. 6º e 7º).
- Dispositivos para **investigação clínica** estão isentos de notificação ou registro, cumpridas as
  normas (art. 1º, §8º).

### 2.3 Base legal da proibição genérica

- [Lei 6.360/1976](https://www.planalto.gov.br/ccivil_03/leis/l6360.htm):
  - art. 12: nenhum produto *"poderá ser industrializado, exposto à venda ou entregue ao consumo antes
    de registrado"*;
  - art. 25: *"aparelhos, instrumentos e acessórios usados em medicina"* dependem de pronunciamento do
    Ministério da Saúde sobre a obrigatoriedade de registro.
- [Lei 6.437/1977](https://www.planalto.gov.br/ccivil_03/leis/l6437.htm), art. 10, IV — é infração
  sanitária *"produzir, fabricar… ceder ou usar… correlatos… sem registro, licença, ou autorizações do
  órgão sanitário competente"*.
- **Nuance (interpretação minha):**
  - O espaçador moldado à mão no campo é prática rotineira, tratada como ato profissional com produto
    registrado.
  - O que muda com a impressão 3D é o **molde**: ele é um produto fabricado fora do canal regulado e
    que entra no campo estéril.

### 2.4 Esterilização no hospital — RDC 15/2012

[RDC 15/2012 — AnvisaLegis](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000015&seqAto=000&valorAno=2012&orgao=RDC/DC/ANVISA/MS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true)

- **Art. 9º:** *"O CME e as empresas processadoras só podem processar produtos para saúde
  regularizados junto à Anvisa."* ← barreira formal para um molde impresso no próprio hospital.
- Art. 11: produto crítico deve ser esterilizado.
- Art. 37: qualificação de instalação, operação e desempenho dos equipamentos, pelo menos uma vez por
  ano.
- Art. 98: produto implantável exige indicador biológico em cada carga.
- Art. 25: rastreabilidade de cada lote, com registros guardados por pelo menos 5 anos.
- Consequência prática: o molde deveria chegar **estéril de um fabricante regularizado**, ou o hospital
  precisa de uma posição formal da vigilância sanitária local e da RT do CME.

### 2.5 Off-label, ética e pesquisa

- [Parecer CFM 2/2016](https://sistemas.cfm.org.br/normas/arquivos/pareceres/BR/2016/2_2016.pdf),
  ementa: *"Os procedimentos médicos off label são aqueles em que se utilizam materiais ou fármacos fora
  das indicações em bula ou protocolos, e sua indicação e prescrição são de responsabilidade do médico."*
  O texto inclui **materiais**, o que alcança o cimento.
- [Código de Ética Médica, Res. CFM 2.217/2018](https://portal.cfm.org.br/images/PDF/cem2019.pdf):
  - art. 1º: a responsabilidade é pessoal;
  - art. 22: consentimento após esclarecimento;
  - art. 32: usar os meios cientificamente reconhecidos;
  - art. 87: prontuário;
  - art. 101: TCLE em pesquisa;
  - **art. 102, par. único:** terapêutica experimental só *"quando aceita pelos órgãos competentes e com o
    consentimento do paciente"*;
  - art. 68: vedada dependência de indústria que fabrica ou comercializa produtos de prescrição. Conta
    se o gerador ou os moldes virarem negócio.
- [Res. CFM 1.982/2012](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2012/1982_2012.pdf):
  procedimentos novos ou experimentais passam por protocolo aprovado pelo sistema CEP/Conep.
  - O espaçador em dois tempos é técnica consagrada.
  - O molde impresso é variação de ferramenta, não procedimento novo (interpretação minha).
  - Série de casos ou publicação → CEP.
- [RDC 837/2023](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000837&seqAto=000&valorAno=2023&orgao=RDC/DC/ANVISA/MS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true)
  (investigação clínica com dispositivos):
  - vale para estudos "para fins regulatórios";
  - dispositivos de classe I/II não são submetidos à Anvisa, mas devem seguir boas práticas clínicas
    (art. 2º, §§1º e 2º);
  - classe III/IV sem registro exige DICD (art. 4º).
- O texto da Res. CNS 466/2012 foi citado pelas fontes, mas eu não o li (**NÃO VERIFICADO**).

### 2.6 Eventos adversos e responsabilidade civil

- [RDC 36/2013](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000036&seqAto=000&valorAno=2013&orgao=RDC/DC/ANVISA/MS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true):
  o Núcleo de Segurança do Paciente deve *"notificar ao Sistema Nacional de Vigilância Sanitária os
  eventos adversos"*.
- [RDC 67/2009](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000067&seqAto=000&valorAno=2009&orgao=RDC/DC/ANVISA/MS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true):
  tecnovigilância do detentor. A RDC 925 (art. 15) a aplica ao fabricante de sob medida.
- [CDC, Lei 8.078/1990](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm):
  - art. 14, §4º: *"A responsabilidade pessoal dos profissionais liberais será apurada mediante a
    verificação de culpa"*;
  - art. 14, caput: o hospital como prestador de serviço responde de forma objetiva;
  - **art. 12:** o *fabricante* responde **independentemente de culpa** por defeitos *"de projeto,
    fabricação…"*.
  - → **Interpretação (não é parecer):** projetar e imprimir o molde pode trazer para o
    cirurgião/hospital a responsabilidade **objetiva** de fabricante quanto ao produto, além da
    responsabilidade subjetiva pelo ato médico.
- [Lei 13.787/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm), art. 6º:
  prontuário guardado por no mínimo **20 anos** desde o último registro.

### 2.7 Precedentes no Brasil (o que achei)

- **ProMED / CTI Renato Archer (MCTI):**
  - biomodelos e outros produtos 3D para o SUS desde 2000, em náilon por SLS ([CTI ProMED](https://www.gov.br/cti/pt-br/acesso-a-informacao/acoes-e-programas/programas-acoes-obras-e-atividades/promed-1);
    [notícia MCTI 2024](https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/noticias/2024/12/biomodelo-3d-do-cti-renato-archer-e-usado-em-planejamentos-cirurgicos-de-alta-complexidade));
  - a página do programa cita *"próteses sob medida"*;
  - as páginas não mencionam o enquadramento na Anvisa;
  - o número de "mais de 7.000 planejamentos" veio de resumo de busca (**NÃO VERIFICADO** na página).
- **Hospital XV, Curitiba** — [Ramos, Wild, Martins. Rev Bras Ortop 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10212635/):
  PLA impresso esterilizado por autoclave e por óxido de etileno (EtO). Os autores dizem que há regras
  em outros países, mas *"não as encontramos em nosso meio"*.
- **Hospital em São Paulo** — [Zocratto da Silveira Cardoso et al. AORN J 2026;123(5):371-379](https://doi.org/10.1002/aorn.70075):
  limpeza manual validada por teste de proteína e duas formas de secagem em **"moldes e guias
  cirúrgicos"** impressos. Mostra que já há hospitais brasileiros levando peças impressas ao campo.
- **Espaçadores pré-formados vendidos no Brasil:**
  - Subiton (joelho, registro "81361440028" segundo a [loja Víncula](https://vincula.com.br/loja/product/espacador-temporario-para-joelho/));
  - linha Tecres, distribuída por [OrthoWay (Advita/Exactech e Tecres)](https://orthoway.med.br/).
  - Os registros não foram conferidos na base da Anvisa: o consultas.anvisa.gov.br bloqueou o acesso
    automatizado (**NÃO VERIFICADO**).
  - **Não achei espaçador ou molde de ombro registrado** (**NÃO VERIFICADO** — conferir manualmente).
- **Não achei** caso publicado no Brasil de molde impresso no hospital para espaçador, nem guia da
  Anvisa sobre impressão 3D em serviço de saúde (**NÃO VERIFICADO** como inexistente; a busca foi
  limitada).

---

## 3. EUA (FDA)

- **Moldes de espaçador têm 510(k), todos classe II** ([consulta openFDA](https://api.fda.gov/device/510k.json?search=device_name:(spacer+AND+(mold+OR+molds+OR+mould))&limit=50)).
  São 12 no total. Os de ombro:
  - K131135 (2014)
  - [K160071](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K160071) (2016)
  - K221968 (2022, StageOne Shoulder)
  - [K240856](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K240856)
    (Osartis GmbH, 2024: Hip/Knee/Shoulder Spacer Molds)
  - Os de ombro seguem 21 CFR 888.3027, código **MBB "Bone Cement, Antibiotic"**, e são **produto
    combinado**.
- **Resumo do [K160071](https://www.accessdata.fda.gov/cdrh_docs/pdf16/K160071.pdf):**
  - molde *"sterile disposables made of medical grade silicone"*;
  - uso só com Palacos R+G ou Refobacin R;
  - espaçador por *"not… more than 180 days"*, com restrição de atividade;
  - desempenho demonstrado por **ensaio mecânico e eluição de gentamicina** do espaçador formado;
  - sem dados clínicos.
  - → Mostra o que a FDA pede de um molde: **o espaçador que ele produz** é o objeto avaliado.
- **Documento de discussão de impressão 3D no ponto de atendimento** ([dez/2021](https://www.fda.gov/media/154729/download)):
  - não é política;
  - propõe três cenários:
    1. o hospital usa um "MDPS" (sistema de produção) liberado;
    2. um fabricante tradicional se instala junto ao hospital;
    3. o hospital assume todas as responsabilidades de fabricante;
  - diz que a impressão 3D, incluindo o pós-processamento, *"may be considered manufacturing"* →
    registro e listagem (21 CFR 807), QS/QMSR (21 CFR 820), MDR (803);
  - avalia flexibilizar exigências para dispositivos "very low risk".
- **Isenção de dispositivo custom** ([guia 2014](https://www.fda.gov/media/89897/download), seção 520(b)):
  - isenta **apenas** de PMA e de padrões de desempenho;
  - **não** isenta de QS com controle de projeto, MDR, rotulagem, registro e listagem;
  - limite de 5 unidades por ano por tipo, com relatório anual;
  - o QS virou QMSR, em vigor desde 02/02/2026 (nota no próprio guia).
  - **Precedente:** moldes de CoCr por SLM para espaçador de tálus, feitos pela restor3D, *"cleared for
    use under the FDA custom device exemption pathway"*
    ([Broughton et al. 3D Print Med 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8447608/)).
- **Prática da medicina** ([21 U.S.C. 396](https://www.law.cornell.edu/uscode/text/21/396)):
  - protege a prescrição de *"any legally marketed device"* fora da bula;
  - **não** transforma um molde caseiro em dispositivo legalmente comercializado.
- **Cimento:**
  - ALBC comercial foi liberado pela FDA *"only for use in the second stage of a two-stage total joint
    revision"* (Jiranek, Hanssen, Greenwald, [JBJS 2006;88:2487](https://doi.org/10.2106/JBJS.E.01126));
    frase obtida por resumo de busca, texto integral não lido (**NÃO VERIFICADO**);
  - ALBC em dose baixa aprovado em 2003; não há produto de dose alta aprovado
    ([Schwarz et al. J Orthop Res 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7390691/)).
- **Visão hospitalar americana** ([Beitler et al. 3D Print Med 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8809025/)):
  - guias e instrumentos paciente-específicos são tipicamente classe II;
  - o hospital que passa a fabricar assume *"increased liability… as the legal manufacturer"*;
  - recomenda IQ/OQ/PQ dos processos.

## 4. União Europeia (MDR 2017/745)

- **Dispositivo sob medida (CMD, art. 2(3))** — [MDCG 2021-3](https://health.ec.europa.eu/system/files/2021-03/mdcg_2021-3_en_0.pdf):
  - *"A 3D printed device does not qualify as a CMD by default"*;
  - a prescrição precisa conter características de projeto específicas;
  - *"Dimensions and/or geometric parameters (such as DICOM files…) are not considered specific design
    characteristics on their own"*;
  - **guias de corte impressos são exemplo de patient-matched**, que segue a via normal de marcação CE;
  - o fabricante de CMD tem sistema de qualidade (QMS), declaração do Anexo XIII e PSUR;
  - CMD implantável classe III → organismo notificado.
- **Isenção de fabricação no hospital (art. 5(5))** — [texto do art. 5](https://www.medical-device-regulation.eu/mdr-article-5-placing-on-the-market-and-putting-into-service/)
  e [MDCG 2023-1](https://health.ec.europa.eu/system/files/2023-01/mdcg_2023-1_en.pdf). Condições:
  - (a) não transferir o dispositivo para outra pessoa jurídica;
  - (b) QMS adequado;
  - (c) justificar que nenhum dispositivo CE equivalente atende;
  - (d–g) informar a autoridade, declaração pública e documentação;
  - (h) revisar a experiência clínica.
  - Aplica-se a escala não industrial.
  - Pelo MDCG 2023-1, *"Custom-made devices are out of scope of Article 5(5)"*.
  - "Manufactured" inclui fabricar a partir de matéria-prima.
  - Há modelo de declaração pública no Anexo A.
- **Classificação** ([Anexo VIII](https://www.medical-device-regulation.eu/annex-viii/)):
  - Regra 6: cirurgicamente invasivo transitório → IIa;
  - Regra 8: prótese articular → III;
  - Regra 14: com substância medicamentosa → III.
  - A classe do **molde** na UE ficou **NÃO VERIFICADA**. Há moldes comerciais estéreis de uso único
    (ex.: [COPAL knee moulds, Heraeus](https://www.heraeus-medical.com/en-us/healthcare-professionals/products/copal-knee-moulds/)),
    mas não vi a classe CE deles.
- **Base internacional:** as categorias da RDC 925 e do MDCG vêm do [IMDRF PMD N49 (2018)](https://www.imdrf.org/documents/definitions-personalized-medical-devices).

## 5. Material e esterilização do molde (evidência que entra no registro de projeto)

| Estudo | Achado útil |
|---|---|
| [Popescu et al. 3D Print Med 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12317548/) (10 filamentos FDM/MEX) | Após plasma de H2O2, PETG, PC e PETG-CF mantiveram a precisão; **PLA, PLA-HP e PA deformaram**; a autoclave deformou a maioria |
| [Aguado-Maestro et al. Injury 2021](https://doi.org/10.1016/j.injury.2020.09.014) | PLA oco (12% de preenchimento) contaminado por dentro: EtO e vapor esterilizaram, **plasma falhou em 2/5**, vapor deformou tudo. Recomendam EtO, ou preenchimento de 100% se usar plasma |
| [Ramos et al. Rev Bras Ortop 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10212635/) (Brasil) | Autoclave 121 °C rápida: 50% contaminado (sólido); EtO: 0% (sólido) e 20% (oco) |
| [Ferràs-Tarragó et al. EJTES 2022](https://doi.org/10.1007/s00068-020-01564-1) | Autoclave a 134 °C esterilizou placas de PLA (não mediu precisão dimensional) |
| [Gielisch et al. Biomed Mater 2024](https://doi.org/10.1088/1748-605X/ad8c8a) | MED610 e PLA/PHA não citotóxicos após vapor; **o suporte SUP705 é citotóxico** → cavidade sem material de suporte |
| [Alaseem et al. Curr Oncol 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12384866/) | Molde de resina não médica, esterilizado por plasma, com aprovação do comitê de ética (IRB) e consentimento; o molde *"did not come into direct contact with the patient"* |

- A compatibilidade do polímero impresso com o **monômero MMA** e com a **exotermia** do cimento não foi
  verificada aqui (**NÃO VERIFICADO**). Precisa de teste de bancada: deformação, aderência e resíduo na
  superfície do espaçador.

## 6. Checklist de documentação (por caso, mesmo sem fabricante licenciado)

**A. Antes da cirurgia**
- Justificativa clínica no prontuário: indicação e por que não usar um produto registrado. Anotar a
  busca feita no consultas.anvisa.gov.br.
- **Ficha de projeto / prescrição assinada** (nome, CRM):
  - todos os parâmetros;
  - versão do gerador (commit);
  - hash SHA-256 dos STL;
  - data;
  - material escolhido.
- **TCLE específico**, adaptando o Anexo I da RDC 925:
  - molde sem registro na Anvisa;
  - cimento com antibiótico em dose alta = off-label;
  - espaçador temporário, com risco de fratura, luxação e segundo tempo obrigatório;
  - autorização para uso de imagens e dados se houver publicação.
- Ciência formal da diretoria técnica, da CCIH/NSP e da RT do CME; o art. 9º da RDC 15 precisa ser
  discutido com eles. CEP se for série de casos.

**B. Registro de projeto** ("registro histórico do projeto", [RDC 665/2022](https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000665&seqAto=000&valorAno=2022&orgao=RDC/DC/ANVISA/MS&codTipo=&desItem=&desItemFim=&cod_menu=1696&cod_modulo=134&pesquisa=true), arts. 3º e 61)
- Requisitos de projeto.
- Verificação: dimensões do espaçador contra as entradas, espessuras mínimas, extração sem rebaixo,
  encaixe das duas metades.
- Validação de bancada com cimento real: desmoldagem, temperatura, deformação.
- Análise de risco. A norma ISO 14971 é a de referência, mas não consultei o texto.

**C. Registro de fabricação** ("registro histórico do produto", RDC 665, arts. 39–40)
- Impressora e material: lote, ficha técnica e certificado de biocompatibilidade.
- Parâmetros de impressão (preenchimento), pós-processamento e inspeção dimensional.
- Limpeza (ver o estudo AORN 2026) e embalagem.
- Esterilização com método **validado para aquele material e geometria**: ciclo, indicadores químicos
  e biológicos, lote.
- **Número de rastreio** gravado no molde e anotado no prontuário.

**D. Na cirurgia / no prontuário**
- Cimento: marca, lote e número de registro na Anvisa.
- Antibióticos: nome, dose e lote.
- Número do molde, fotos e etiquetas de rastreio.

**E. Depois**
- Seguimento.
- Evento adverso → NSP / SNVS (RDC 36/2013).
- Guarda: prontuário ≥ 20 anos (Lei 13.787/2018); dossiê de implantável 15 anos, por analogia com o
  art. 11 da RDC 925.

## 7. Caminhos possíveis no Brasil (do mais para o menos defensável)

1. **Fabricante licenciado** (AFE + licença + BPF) produz o molde e o entrega estéril:
   - como *sob medida* a partir da prescrição do cirurgião (classe I/II → só dossiê); ou
   - como *paciente-específico* notificado.
   - O gerador é a ferramenta de projeto do prescritor ou do fabricante.
2. **Protocolo de pesquisa** (CEP; RDC 837 só se o dispositivo for de classe III/IV sem registro), com
   o molde tratado como dispositivo em investigação (RDC 751, art. 1º, §8º).
3. **Uso excepcional pelo cirurgião ou hospital, sem fabricante:**
   - zona cinzenta, com risco de infração sanitária (Lei 6.437, art. 10, IV) e choque com o art. 9º da
     RDC 15;
   - mitigar com a documentação da seção 6 e com consulta formal à vigilância sanitária local / Anvisa.
4. **Alternativas registradas:** espaçador pré-formado ou molde registrado, se existir para ombro (a
   conferir), ou espaçador moldado à mão.

## Fontes consultadas (principais)

**Brasil — normas e textos oficiais**
- RDC 925/2024, 751/2022, 665/2022, 15/2012, 837/2023, 36/2013, 67/2009, 657/2022 (AnvisaLegis, links
  acima).
- Perguntas e respostas da Anvisa (RDC 305, arquivo; RDC 925, em revisão).
- Leis 6.360/76, 6.437/77, 8.078/90 e 13.787/2018 (Planalto).
- CEM 2018, Parecer CFM 2/2016, Res. CFM 1.982/2012.

**EUA**
- FDA: documento de discussão POC (2021), guia de isenção custom (2014), K160071, K240856, openFDA
  510(k).
- 21 U.S.C. 396.

**UE e internacional**
- MDCG 2021-3, MDCG 2023-1, MDR art. 5 e Anexo VIII, IMDRF N49.

**Literatura**
- Beitler 2022; Broughton 2021; Alaseem 2025; Popescu 2025; Aguado-Maestro 2021; Ramos 2023;
  Ferràs-Tarragó 2022; Gielisch 2024; Zocratto 2026; Schwarz 2020; Jiranek 2006.
- [Klosterman et al. Arthrosc Tech 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7917196/): usa
  moldes comerciais "Aequalis Ascend Flex Convertible Shoulder System Molds" (Wright) + Palacos com
  vancomicina 4,0 g e tobramicina 7,2 g.

**Limitações desta pesquisa:** o consultas.anvisa.gov.br (Cloudflare) e o EUR-Lex (WAF) bloquearam o
acesso automatizado; o texto do MDR veio de um site secundário. A cota de busca web se esgotou antes de
eu procurar fabricantes brasileiros de guias paciente-específicos (CPMH, Bioarchitects) e o registro
Anvisa do Palacos R+G.
