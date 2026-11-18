# How Mborevi Rape follows the MEC

This file covers what the app says about the teaching of Guarani in Paraguay, the MEC document and page behind each
statement, and what the app does not cover yet. It was checked in November 2026 against the MEC documents listed
below.

## Documents checked

| Document | What was used | Pages |
| --- | --- | --- |
| Ley 1264/98 General de Educación | Art. 31, the languages of teaching | |
| Programa de estudio, 2.º grado, Educación Escolar Básica | The three models of bilingual education; the Test de Competencia Lingüística; the second language and passing the grade | printed pp. 28–31, 49 |
| Priorización curricular 2021, 1.er y 2.º ciclo | The Comunicación tables (Castellano and Guaraní) for both cycles; weekly hours | PDF pp. 21–28, 41–47 (printed page = PDF page − 6) |
| Guía para la planificación de clases en tiempos de pandemia, 1.er ciclo (2021) | Comunicación Guaraní, 1.º to 3.º grado, week by week | printed pp. 50–70 |
| Marco conceptual de la Jornada Escolar Extendida (draft, «versión a validar») | The TCL before learning to read; the second language in the 1.er ciclo | |
| Comunicación 1.º grado, guía didáctica, Unidad 1 (draft for validation) | Castellano literacy in 1.º grado: the vowels come first | |
| Educación Inicial: Preescolar poem activity; Pre Jardín and Jardín activity proposal | Nothing on Guarani | |

## The law

Ley 1264/98, art. 31: «La enseñanza se realizará en la lengua oficial materna del educando desde los comienzos del
proceso escolar o desde el primer grado. La otra lengua oficial se enseñará también desde el inicio de la educación
escolar con el tratamiento didáctico propio de una segunda lengua.»

## The three tracks

The app's question «¿Qué se habla en casa?» follows the MEC's three models of bilingual education. Programa 2.º grado,
p. 28: «el sistema educativo propone tres modelos de educación bilingüe. La elección del modelo a ser aplicado en cada
escuela e incluso en cada grado depende de las características sociolingüísticas de los/as niños/as.»

### Más guaraní (L1) = Propuesta A, Guaraní L1

What the Programa asks for Guarani in 1.º grado (p. 28): «En guaraní, desarrollo de la comprensión oral, expresión
oral, comprensión escrita y expresión escrita, en un tiempo mínimo de cinco horas didácticas semanales.»

### Más castellano (L2) = Propuesta B, Castellano L1

What the Programa asks for Guarani in 1.º grado (p. 30): «En guaraní, desarrollo de la comprensión oral, expresión
oral, comprensión escrita y expresión escrita, en un tiempo mínimo de cuatro horas didácticas semanales. En este
grado, la comprensión escrita y la expresión escrita contienen capacidades consideradas no básicas, es decir, no
inciden en la promoción de los/as alumnos/as.»

From 2.º grado, the same four abilities are listed without that exception (p. 30).

### Las dos por igual (BI) = Propuesta C, Guaraní y Castellano L1

What the Programa asks for Guarani in 1.º grado (p. 31): «En castellano y en guaraní, desarrollo de las capacidades de
comprensión oral, expresión oral, comprensión escrita y expresión escrita, en un tiempo mínimo de ocho horas didácticas
semanales. […] Todas las macrohabilidades mencionadas contienen capacidades consideradas básicas.»

### Speaking comes first in the second language

Programa, p. 49: «las habilidades orales en la segunda lengua se consideran importantes desde los inicios del proceso
de enseñanza-aprendizaje e incidirán en la promoción, puesto que las mismas constituyen la base para adquirir las
escritas».

The Priorización curricular 2021 agrees:

- **Its 1.er ciclo «Comunicación Guaraní» table is the second-language table** (p. 26): «Podrían seguir apareciendo
  imperfecciones propias del proceso de aprendizaje de la L2».
- **Its 1.º grado scope is oral** (p. 26): «utilizar vocabulario elemental relacionado con datos personales, del hogar y
  la escuela, mantener conversaciones breves aplicando funciones comunicativas básicas».
- **But its 1.º grado list already includes writing** (item 17, p. 28): «Escribe tarjetas, adivinanzas, diálogos,
  descripciones […] y narraciones breves.»
- **2.º grado is the first to say «en forma oral y escrita»** (p. 26).
- **The «Comunicación Castellano» table is the mother-tongue table, and it also covers Guarani.** Item 17, p. 25: «La
  tilde y la marca de nasalidad, en el caso del guaraní.»

### How the app follows this

- Preescolar is oral on every track.
- With Guarani as mother tongue (L1) or with both languages (BI), the child reads and writes Guarani from 1.º grado.
- With Guarani as second language (L2), 1.º grado is played mostly by ear, since speaking and listening are what count
  for passing the grade. The one exception is the alphabet unit's letter game for the oral and nasal vowels. The 2021
  planning guide puts the vowels in 1.º grado: «Las vocales orales» (week 4, p. 52) and «Las vocales nasales» (week 12,
  p. 54). From 2.º grado the L2 track reads and writes too.

### Who decides the track

In the app, the family does. At school, the Test de Competencia Lingüística does. Programa, p. 31: «Para identificar la
lengua de uso predominante de los/as niños/as, el MEC propone la aplicación del Test de Competencia Lingüística, que
consiste en un instrumento de evaluación del dominio lingüístico oral de los/as niños/as de entre 5 y 6 años. Por lo
tanto, puede ser aplicado a los/as alumnos/as del Preescolar o del 1º grado.» The Jornada Escolar Extendida draft:
«La primera actividad antes de iniciar la alfabetización inicial es la identificación de la Lengua Materna de cada
niño y del grupo clase a través de la aplicación del Test de Competencia Lingüística (TCL).»

## Where each statement in the app comes from

The texts are in `project/tp-course.js` (`C.TRACKS`) and in `project/tp-grades.js` (`can` and `mec` of each grade).
On the Grownups page, `mec` appears under «Lo que pide el programa» and `can` under «En la app».

| Where | Source |
| --- | --- |
| Home and Grownups, «Más guaraní» note | Programa p. 28 |
| Home and Grownups, «Más castellano» note: «en 1.º grado el guaraní es sobre todo oral; leer y escribir se piden desde 2.º grado» | Programa pp. 30, 49; Priorización p. 26 |
| Home and Grownups, «Las dos por igual» note | Programa p. 31 |
| Home, the law note | Ley 1264/98, art. 31 |
| Grownups, the TCL line | Programa p. 31; Jornada Escolar Extendida draft |
| Preescolar, «Lo que pide el programa» | Ley 1264/98, art. 31; Programa p. 31 |
| 1.º grado, «Lo que pide el programa» | Programa pp. 28, 30, 49. Priorización items 4–5 (p. 26), 10 and 14 (p. 27), 16–17 (p. 28). Planning guide weeks 4 and 12 |
| 2.º grado, «Lo que pide el programa» | Priorización p. 23 (mother tongue), p. 26 (the 2.º grado scope), item 3 (p. 26), item 12 (p. 27), items 16–17 (p. 28). Planning guide week 12 («Abecedario», p. 61) |
| 3.º grado, «Lo que pide el programa» | Priorización p. 23 (mother-tongue scope and item 4), p. 24 (item 9), p. 26 (L2 scope and item 3), item 6 and item 11 (p. 27) |
| 4.º–6.º grado, «Lo que pide el programa» | Priorización, the 2.º ciclo Guarani scope of each grade, p. 45 (written in Guarani) |
| Units of 2.º grado 4–5 and of 3.º grado 1 | Priorización item 3 (p. 26) and item 7 (p. 27); «kũjererã» is the document's own word (item 11, p. 46) |

The full check of the Priorización is in `docs/mec-check.json`. Three agents read the document independently, a judge
gave a verdict on each statement, and a fourth agent challenged each verdict.

## What changed after the check

- **«Más castellano» note.** It now says L2 1.º grado is «sobre todo oral». It used to say that reading and writing
  start in 2.º grado, but they start in 1.º grado and only count from 2.º.
- **Vowels for L2.** L2 1.º grado now plays the letter game in the two vowel nights.
- **«Lo que pide el programa» for Preescolar to 6.º grado** was rewritten from the documents. Dropped as unsupported:
  - «palabras que se escriben igual en castellano y en guaraní»
  - «preguntar por un lugar… dar direcciones»
  - «textos… formales» (2.º ciclo)
  - main ideas and recipes as L2 aims; they belong to the mother-tongue table.
- **Three outlined units retitled to match the program:**
  - 2.º grado «Moõpa? · Instrucciones: ubicar cosas e ir a un lugar»
  - 2.º grado «Purahéi ha kũjererã · Canciones, rimas y trabalenguas»
  - 3.º grado «Instrucciones: usar objetos y aparatos»
- **Grownups.** Preescolar is «Sobre todo oral», no longer «Todo oral».

## In the program, not in the app yet

- **Asking for things, 1.º to 3.º grado.**
  - 1.º grado, item 16 (p. 28): «Expresa sus necesidades tales como pedir ayuda, favor, permiso, préstamo de algún
    objeto o material».
  - 2.º grado, item 16 (p. 28): «Expresa necesidades básicas como: ir al baño, tomar agua, pedir alimentos, solicitar
    permiso y prestar algo».
  - 3.º grado, planning guide week 16 (p. 68).
  - This is the largest gap: no unit teaches it yet.
- **Following short instructions** (item 3, p. 26): «manipular objetos y electrodomésticos, ubicarlos en un lugar
  determinado y trasladarse de un lugar a otro». Planned for 2.º and 3.º grado; not in 1.º grado.
- **Short texts heard in 1.º grado** (item 7, p. 27): rhymes, tongue twisters, poems, songs, stories. 1.º grado has one
  sky story; the app's one song is in Preescolar.
- **Dialogues, agreeing and disagreeing, and what one does in the day** (items 13–15, p. 27). The sky unit teaches the
  words for morning, afternoon and night, but not the day's activities.
- **The child's grade** among the personal data (item 5, p. 26). Name, age and country are in the app.
- **Writing short texts:** cards, riddles, dialogues (item 17, p. 28). The L1 and BI tracks build words, not texts.
- **2.º grado:**
  - introducing classmates and family (item 12)
  - capital letters, the accent mark and the nasal mark (item 20, p. 28)
  - short texts read

## Order of topics

These differ from the 2021 planning guide. They were left as they are, because the guide is a suggested weekly order
for one school year, not a requirement.

- **Colours:** the guide has them in 1.º grado (week 18, p. 55); the app has them in Preescolar.
- **The puso:** the guide has it in 2.º grado (week 19, p. 62); the app teaches it in 1.º grado.
- **The double letters mb, nd, ng, nt, rr:** the guide has them in 3.º grado (weeks 12 and 19, pp. 67 and 69); the
  app plans them for 2.º grado.

## Not checked

- **The 3.er ciclo texts (7.º–9.º grado).** None of the documents covers that cycle.
- **The «En la app» texts of 4.º–6.º grado.** They describe this app's own plan for those grades, which also draws on
  the Castellano table (letters and notes, for example). They will be checked against the program when those grades
  are written.
- **The Jornada Escolar Extendida draft.** For the second language, it proposes oral work in 1.º and 2.º grado and
  writing from 3.º grado, in the extra school hours. The app follows the Programa de estudio instead.
