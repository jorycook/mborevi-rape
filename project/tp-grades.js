/* Mborevi Rape: the grades and their lessons.
 * The levels are the grades of Paraguayan schooling in which the MEC teaches Guarani: Preescolar (Educación Inicial)
 * and the nine grades of the Educación Escolar Básica in three cycles. Each grade is a figure of the Guarani sky and
 * has as many units as the figure has stars. Preescolar and 1.º grado are written, and three units of 2.º grado; the
 * other units show their titles while their nights are being written (as Epu'ã shows A2 to C2).
 * What the MEC asks for, checked against the MEC's own documents (Ley 1264/98; Programa de estudio 2.º grado;
 * Priorización curricular 2021; Guía para la planificación de clases, 1.er ciclo, 2021):
 * - Programa de estudio, the three bilingual proposals: in the mother tongue (L1) a child reads and writes from 1.º
 *   grado; in the second language (L2) 1.º grado works all four abilities, but reading and writing "no inciden en la
 *   promoción" there, and the oral abilities do; from 2.º grado reading and writing count too. The app plays 1.º grado
 *   L2 by ear, with the vowels' letter game as its one written part. 3.º grado consolidates both and interprets
 *   instructions (game rules, recipes).
 * - Priorización curricular 2021: its 1.er ciclo «Comunicación Castellano» table is the mother-tongue table (it also
 *   names «el caso del guaraní»), and «Comunicación Guaraní» is the L2 table («propias del proceso de aprendizaje de
 *   la L2»). The L2 table, 1.º grado: greetings and introducing oneself,
 *   personal data (name, age, grade), the words of the immediate context (my body, my family, my home, my school and my
 *   country), short dialogues, the activities of the day (morning, afternoon, night).
 * - Cycle competencies (Programas 2008): 1.er ciclo L2, short oral and written texts with basic communicative functions
 *   for immediate contexts; 2.º ciclo (Priorización 2021, its Guarani table, written in Guarani): oral and written
 *   texts with everyday, then harder words, to tell needs, feelings and thoughts (no «formal» texts there); 3.er ciclo, the subject
 *   "Guarani Ñe'ẽ ha Iñe'ẽporãhaipyre".
 * The units of 3.º to 9.º grado are this app's proposal from those competencies and from Paraguayan textbooks; they are
 * to be checked against the MEC's Programas de Estudio of each grade. */
window.__tpMeta = [
  { code: 'pre', label: 'Preescolar', gn: '', cycle: 'Educación Inicial', cycleShort: 'Inicial', age: '5 años', sky: 'jasy',
    can: 'Escucha, canta y dice saludos y palabras de todos los días, todo de oído.',
    mec: 'La ley pide enseñar desde el comienzo en la lengua materna del niño, y también desde el inicio la otra lengua oficial, como segunda lengua (Ley 1264/98, art. 31). En Preescolar o al empezar 1.º grado, la escuela puede aplicar el Test de Competencia Lingüística, oral, para saber qué lengua domina mejor cada niño.' },
  { code: 'g1', label: '1.º grado', gn: "Peteĩha mbo'esyry", cycle: '1.er ciclo', cycleShort: '1.er ciclo', age: '6 años', sky: 'eichu',
    can: 'Saluda, dice su nombre y su edad, nombra su cuerpo, su familia, su casa y su escuela, pide ayuda y permiso, cuenta hasta 10 y conoce las vocales. Si el guaraní es su lengua materna, empieza a leer y escribir.',
    mec: '1.er ciclo. Como lengua materna, el guaraní se empieza a leer y escribir. Como segunda lengua, sobre todo se escucha y se habla, y se empiezan a escribir textos cortos; para pasar de grado cuenta lo oral. Temas: saludos, datos personales (nombre, edad, grado), su cuerpo, su familia, su casa, su escuela y su país, las actividades del día, las vocales, pedir ayuda o permiso.' },
  { code: 'g2', label: '2.º grado', gn: "Mokõiha mbo'esyry", cycle: '1.er ciclo', cycleShort: '1.er ciclo', age: '7 años', sky: 'nandupysa',
    can: 'Lee y escribe palabras y frases cortas de animales y comida, pide lo que necesita, aprende las consonantes, sigue instrucciones para ubicar cosas e ir a un lugar, y aprende canciones, rimas y trabalenguas.',
    mec: '1.er ciclo. Como segunda lengua, el guaraní ya se usa en forma oral y escrita: se leen y se escriben textos cortos, como tarjetas, adivinanzas y poemas. Como lengua materna, se sigue desarrollando la lectoescritura. Temas: presentarse y presentar a otros, pedir lo que necesita (ir al baño, tomar agua, comida, permiso), seguir instrucciones, el abecedario.' },
  { code: 'g3', label: '3.º grado', gn: "Mbohapyha mbo'esyry", cycle: '1.er ciclo', cycleShort: '1.er ciclo', age: '8 años', sky: 'nanduguasu',
    can: 'Sigue instrucciones, lee cuentos, fábulas y leyendas, y escribe adivinanzas y descripciones.',
    mec: '1.er ciclo. Como lengua materna, al terminar 3.º grado se logra la competencia del ciclo: tema e idea principal, orden de los hechos, instrucciones como reglas de juegos y recetas. Como segunda lengua, se lee y se escribe en guaraní: orden de los hechos; personajes, acciones, lugar y tiempo de un cuento; instrucciones breves. Todavía puede haber errores propios de quien aprende una segunda lengua.' },
  { code: 'g4', label: '4.º grado', gn: "Irundyha mbo'esyry", cycle: '2.º ciclo', cycleShort: '2.º ciclo', age: '9 años', sky: 'guasu',
    can: 'Escribe cartas y esquelas, describe, y sigue instrucciones orales y escritas.',
    mec: '2.º ciclo: entiende textos escritos y escuchados, ni muy largos ni muy cortos, con palabras de todos los días; cuenta, hablando y escribiendo, lo que necesita y lo que pasa en su comunidad.' },
  { code: 'g5', label: '5.º grado', gn: "Poha mbo'esyry", cycle: '2.º ciclo', cycleShort: '2.º ciclo', age: '10 años', sky: 'mborevi',
    can: 'Lee mitos, leyendas y poesías, cuenta historias y cuida los acentos.',
    mec: '2.º ciclo: empieza a leer con soltura y entiende textos orales y escritos con palabras un poco más difíciles; cuenta, hablando y escribiendo, lo que necesita, lo que siente y lo que pasa a su alrededor.' },
  { code: 'g6', label: '6.º grado', gn: "Poteĩha mbo'esyry", cycle: '2.º ciclo', cycleShort: '2.º ciclo', age: '11 años', sky: 'tuyai',
    can: 'Escucha y lee noticias, describe personajes y deduce lo que un texto no dice.',
    mec: '2.º ciclo, último grado: ya lee con buena soltura textos con palabras más difíciles y cuenta lo que necesita, siente y piensa; todavía puede tener pequeños errores.' },
  { code: 'g7', label: '7.º grado', gn: "Pokõiha mbo'esyry", cycle: '3.er ciclo', cycleShort: '3.er ciclo', age: '12 años', sky: 'rokai',
    can: 'Lee y escribe relatos, poesía y noticias en guaraní.',
    mec: "3.er ciclo: la materia se llama Guarani Ñe'ẽ ha Iñe'ẽporãhaipyre, la lengua y su literatura." },
  { code: 'g8', label: '8.º grado', gn: "Poapyha mbo'esyry", cycle: '3.er ciclo', cycleShort: '3.er ciclo', age: '13 años', sky: 'koe',
    can: 'Escribe cuentos y ensayos breves, debate y traduce.',
    mec: "3.er ciclo: Guarani Ñe'ẽ ha Iñe'ẽporãhaipyre." },
  { code: 'g9', label: '9.º grado', gn: "Porundyha mbo'esyry", cycle: '3.er ciclo', cycleShort: '3.er ciclo', age: '14 años', sky: 'kuarahy',
    can: 'Lee la literatura en guaraní y argumenta por escrito.',
    mec: "3.er ciclo: Guarani Ñe'ẽ ha Iñe'ẽporãhaipyre. Cierra la Educación Escolar Básica." }
];

(function () {
  /* a word: gn as written, es as said in Spanish, the picture, its syllables (for armar la palabra) */
  function w(gn, es, pic, syl) { var o = { gn: gn, es: es, pic: pic || gn }; if (syl) o.syl = syl; return o; }
  /* a unit not written yet: its title and as many empty nights as it will have */
  function soon(n, gn, es) { return { n: n, gn: gn, es: es, nights: [{}, {}, {}] }; }

  window.__tpGrades = {
    /* ---------- Preescolar · Jasy: six units, all oral (look, listen, say) ---------- */
    pre: { units: [
      { n: 1, gn: 'Maitei', es: '¡Hola!', nights: [
        { gn: "Mba'éichapa?", es: '¡Hola! ¿Cómo estás?', words: [
          w("Mba'éichapa?", '¡Hola! ¿Cómo estás?', 'maitei'), w('Iporã', 'Bien', 'iporã'), w('Aguyje', 'Gracias', 'aguyje'), w('Jajotopáta', '¡Nos vemos!', 'jajotopáta')],
          say: [{ gn: "Mba'éichapa?", es: '¿Cómo estás?' }, { gn: 'Iporã, ha nde?', es: 'Bien, ¿y vos?' }] },
        { gn: 'Che réra', es: 'Me llamo…', words: [
          w("Che réra Mborevi'i", "Me llamo Mborevi'i", 'réra'), w("Mba'éichapa nde réra?", '¿Cómo te llamás?', 'porandu'), w('Tereguahẽ porãite', '¡Bienvenida! ¡Bienvenido!', 'óga')],
          say: [{ gn: 'Che réra…', es: 'Me llamo… (decí tu nombre)' }, { gn: "Mba'éichapa nde réra?", es: '¿Cómo te llamás?' }] },
        { gn: 'Pyhare porã', es: 'Buenas noches', words: [
          w("Ko'ẽ porã", 'Buen día', "ko'ẽ"), w("Ka'aru porã", 'Buenas tardes', "ka'aru"), w('Pyhare porã', 'Buenas noches', 'pyhare')] }
      ] },
      { n: 2, gn: 'Che rete', es: 'Mi cuerpo', nights: [
        { gn: 'Che akã', es: 'Mi cabeza', words: [w('Che akã', 'Mi cabeza', 'akã'), w('Che resa', 'Mis ojos', 'resa'), w('Che tĩ', 'Mi nariz', 'tĩ')] },
        { gn: 'Che po', es: 'Mis manos', words: [w('Che juru', 'Mi boca', 'juru'), w('Che nambi', 'Mi oreja', 'nambi'), w('Che po', 'Mi mano', 'po'), w('Che py', 'Mi pie', 'py')] },
        { gn: 'Japurahéi', es: 'Cantemos', words: [w('Che akã', 'Mi cabeza', 'akã'), w('Che resa', 'Mis ojos', 'resa'), w('Che juru', 'Mi boca', 'juru'), w('Che po', 'Mi mano', 'po')],
          say: [{ gn: 'Akã, tesa, tĩ, juru!', es: '¡Cabeza, ojos, nariz, boca! (tocalos mientras cantás)' }] }
      ] },
      { n: 3, gn: 'Mymba', es: 'Los animales', nights: [
        { gn: 'Jagua ha mbarakaja', es: 'El perro y el gato', words: [w('jagua', 'perro'), w('mbarakaja', 'gato'), w('ryguasu', 'gallina')] },
        { gn: 'Kavaju ha vaka', es: 'El caballo y la vaca', words: [w('vaka', 'vaca'), w('kavaju', 'caballo'), w('guyra', 'pájaro')] },
        { gn: 'Pira ha panambi', es: 'El pez y la mariposa', words: [w('pira', 'pez'), w('panambi', 'mariposa'), w('kururu', 'sapo'), w('mborevi', 'tapir')] }
      ] },
      { n: 4, gn: "Sa'y", es: 'Los colores', nights: [
        { gn: "Pytã, sa'yju, hovy", es: 'Rojo, amarillo, azul', words: [w('pytã', 'rojo', 'c-pytã'), w("sa'yju", 'amarillo', "c-sa'yju"), w('hovy', 'azul', 'c-hovy')] },
        { gn: 'Morotĩ ha hũ', es: 'Blanco y negro', words: [w('morotĩ', 'blanco', 'c-morotĩ'), w('hũ', 'negro', 'c-hũ'), w("mbyja sa'yju", 'estrella amarilla', 'mbyja')] },
        { gn: "Sa'ykuéra", es: 'Todos los colores', words: [w('pytã', 'rojo', 'c-pytã'), w("sa'yju", 'amarillo', "c-sa'yju"), w('hovy', 'azul', 'c-hovy'), w('morotĩ', 'blanco', 'c-morotĩ'), w('hũ', 'negro', 'c-hũ')] }
      ] },
      { n: 5, gn: 'Papapy', es: 'Los números', nights: [
        { gn: 'Peteĩ, mokõi, mbohapy', es: 'Uno, dos, tres', words: [w('peteĩ', 'uno', 'n1'), w('mokõi', 'dos', 'n2'), w('mbohapy', 'tres', 'n3')] },
        { gn: 'Irundy ha po', es: 'Cuatro y cinco', words: [w('irundy', 'cuatro', 'n4'), w('po', 'cinco', 'n5'), w('Che po', 'Mi mano (¡tiene cinco dedos!)', 'po')] },
        { gn: "Mboýpa?", es: '¿Cuántos hay?', words: [w('mokõi', 'dos', 'n2'), w('mbohapy', 'tres', 'n3'), w('irundy', 'cuatro', 'n4'), w('po', 'cinco', 'n5')] }
      ] },
      { n: 6, gn: 'Jasy ha mbyja', es: 'La luna y las estrellas', nights: [
        { gn: 'Kuarahy ha jasy', es: 'El sol y la luna', words: [w('kuarahy', 'sol'), w('jasy', 'luna'), w('mbyja', 'estrella')] },
        { gn: 'Arai ha ama', es: 'Las nubes y la lluvia', words: [w('arai', 'nube'), w('ama', 'lluvia'), w('pyhare', 'noche')] },
        { gn: 'Mborevi Rape', es: 'El camino del tapir', story: 'rape', words: [w('Mborevi Rape', 'la Vía Láctea', 'mborevirape'), w('mborevi', 'tapir'), w('jasy', 'luna')],
          games: { all: ['meet', 'story', 'say'] } }
      ] }
    ] },

    /* ---------- 1.º grado · Eichu: eight units, the MEC's first-grade contexts; reading and writing start here for L1 ---------- */
    g1: { units: [
      { n: 1, gn: 'Maitei', es: 'Saludar, presentarse y despedirse', nights: [
        { gn: 'Maitei', es: 'Saludar', words: [w('Maitei', '¡Hola! (un saludo)', 'maitei', ['Mai', 'tei']), w("Mba'éichapa?", '¿Cómo estás?', 'porandu', ['Mba', "'éi", 'cha', 'pa']), w('Iporã', 'Bien', 'iporã', ['I', 'po', 'rã']), w('Tereguahẽ porãite', '¡Bienvenida! ¡Bienvenido!', 'óga')],
          say: [{ gn: "Maitei! Mba'éichapa?", es: '¡Hola! ¿Cómo estás?' }, { gn: 'Iporã, ha nde?', es: 'Bien, ¿y vos?' }] },
        { gn: 'Che réra', es: 'Mi nombre', words: [w('Che réra…', 'Me llamo…', 'réra'), w('Aguereko poteĩ ary', 'Tengo seis años', 'n6'), w('Che paraguaigua', 'Soy de Paraguay', 'poyvi')],
          say: [{ gn: 'Che réra…', es: 'Me llamo… (decí tu nombre)' }, { gn: 'Mboy arýpa reguereko?', es: '¿Cuántos años tenés?' }, { gn: 'Aguereko … ary.', es: 'Tengo … años. (decí tu edad)' }] },
        { gn: 'Jajotopáta', es: 'Despedirse', words: [w('Aguyje', 'Gracias', 'aguyje', ['A', 'guy', 'je']), w('Jajotopáta', '¡Nos vemos!', 'jajotopáta', ['Ja', 'jo', 'to', 'pá', 'ta']), w('Pyhare porã', 'Buenas noches', 'pyhare')] }
      ] },
      { n: 2, gn: 'Che rogaygua', es: 'Mi familia y mi casa', nights: [
        { gn: 'Che sy ha che ru', es: 'Mi mamá y mi papá', words: [w('Che sy', 'Mi mamá', 'sy'), w('Che ru', 'Mi papá', 'ru'), w('mitã', 'niña, niño', 'mitã', ['mi', 'tã'])],
          say: [{ gn: "Kóva ha'e che sy.", es: 'Esta es mi mamá.' }, { gn: "Kóva ha'e che ru.", es: 'Este es mi papá.' }] },
        { gn: 'Che jarýi ha che ramói', es: 'Mi abuela y mi abuelo', words: [w('Che jarýi', 'Mi abuela', 'jarýi'), w('Che ramói', 'Mi abuelo', 'ramói'), w('Che sy', 'Mi mamá', 'sy')] },
        { gn: 'Che róga', es: 'Mi casa', words: [w('óga', 'casa', 'óga', ['ó', 'ga']), w('tupa', 'cama', 'tupa', ['tu', 'pa']), w('apyka', 'silla', 'apyka', ['a', 'py', 'ka'])] }
      ] },
      { n: 3, gn: 'Che rete', es: 'Mi cuerpo', nights: [
        { gn: 'Akã ha tesa', es: 'La cabeza y los ojos', words: [w('akã', 'cabeza', 'akã', ['a', 'kã']), w('tesa', 'ojo', 'resa', ['te', 'sa']), w('tĩ', 'nariz', 'tĩ'), w('juru', 'boca', 'juru', ['ju', 'ru'])] },
        { gn: 'Nambi, po ha py', es: 'La oreja, las manos y los pies', words: [w('nambi', 'oreja', 'nambi', ['na', 'mbi']), w('po', 'mano', 'po'), w('py', 'pie', 'py')] },
        { gn: 'Che resa', es: 'Mis ojos: tesa con che', words: [w('Che akã', 'Mi cabeza', 'akã'), w('Che resa', 'Mis ojos', 'resa'), w('Che po', 'Mi mano', 'po')] }
      ] },
      { n: 4, gn: "Che mbo'ehao", es: 'Mi escuela', nights: [
        { gn: "Mbo'ehao", es: 'La escuela', words: [w("mbo'ehao", 'escuela', "mbo'ehao", ['mbo', "'e", 'ha', 'o']), w("mbo'ehára", 'maestra, maestro', "mbo'ehára", ['mbo', "'e", 'há', 'ra']), w('irũ', 'amiga, amigo', 'irũ', ['i', 'rũ'])] },
        { gn: 'Aranduka ha haiha', es: 'El libro y el lápiz', words: [w('aranduka', 'libro', 'aranduka', ['a', 'ra', 'ndu', 'ka']), w('haiha', 'lápiz', 'haiha', ['hai', 'ha']), w('kuatia', 'hoja de papel', 'kuatia')] },
        { gn: 'Okẽ ha ovetã', es: 'La puerta y la ventana', words: [w('okẽ', 'puerta', 'okẽ', ['o', 'kẽ']), w('ovetã', 'ventana', 'ovetã', ['o', 've', 'tã']), w('Ñañembosarái!', '¡Juguemos!', 'pelota')] }
      ] },
      { n: 5, gn: 'Ikatúpa?', es: 'Pedir con cortesía y agradecer', nights: [
        { gn: 'Chepytyvõmína', es: 'Pedir ayuda y favores', words: [w("mbo'ehára", 'maestra, maestro', "mbo'ehára", ['mbo', "'e", 'há', 'ra']), w('Chepytyvõ', 'Ayudame', 'pytyvõ', ['Che', 'py', 'ty', 'võ']), w("Eipe'amína ovetã", 'Abrí la ventana, por favor', 'ovetã'), w('Aguyje', 'Gracias', 'aguyje', ['A', 'guy', 'je'])],
          say: [{ gn: "Mbo'ehára, chepytyvõmína.", es: 'Maestra, ayudame, por favor.' }, { gn: 'Héẽ, roipytyvõta.', es: 'Sí, te ayudo.' }, { gn: 'Aguyje!', es: '¡Gracias!' }] },
        { gn: 'Ikatúpa aike?', es: 'Pedir permiso', words: [w('Ikatúpa aike?', '¿Puedo pasar?', 'okẽ'), w('Ikatúpa aguapy?', '¿Puedo sentarme?', 'apyka'), w('Ikatúpa ahecha?', '¿Puedo ver?', 'resa'), w('Ikatúpa añembosarái?', '¿Puedo jugar?', 'pelota')],
          say: [{ gn: 'Ikatúpa aike?', es: '¿Puedo pasar?' }, { gn: 'Héẽ, eike. Eguapy.', es: 'Sí, pasá. Sentate.' }, { gn: "Aguyje, mbo'ehára.", es: 'Gracias, maestra.' }] },
        { gn: 'Aguyjevete', es: 'Pedir prestado y dar las gracias', words: [w('irũ', 'amiga, amigo', 'irũ', ['i', 'rũ']), w('Ikatúpa aiporu nde haiha?', '¿Puedo usar tu lápiz?', 'haiha'), w("Eme'ẽmína chéve kuatia", 'Dame una hoja, por favor', 'kuatia'), w('Aguyjevete', 'Muchas gracias', 'aguyje', ['A', 'guy', 'je', 've', 'te'])],
          say: [{ gn: 'Ikatúpa aiporu nde haiha?', es: '¿Puedo usar tu lápiz?' }, { gn: 'Héẽ, ejapyhy.', es: 'Sí, tomá.' }, { gn: 'Aguyjevete, che irũ!', es: '¡Muchas gracias, amiga!' }] }
      ] },
      { n: 6, gn: 'Papapy', es: 'Los números del 1 al 10', nights: [
        { gn: '1 – 5', es: 'Del uno al cinco', words: [w('peteĩ', 'uno', 'n1', ['pe', 'teĩ']), w('mokõi', 'dos', 'n2', ['mo', 'kõi']), w('mbohapy', 'tres', 'n3', ['mbo', 'ha', 'py']), w('irundy', 'cuatro', 'n4', ['i', 'ru', 'ndy']), w('po', 'cinco', 'n5')] },
        { gn: '6 – 10', es: 'Del seis al diez', words: [w('poteĩ', 'seis', 'n6', ['po', 'teĩ']), w('pokõi', 'siete', 'n7', ['po', 'kõi']), w('poapy', 'ocho', 'n8', ['po', 'a', 'py']), w('porundy', 'nueve', 'n9', ['po', 'ru', 'ndy']), w('pa', 'diez', 'n10')] },
        { gn: 'Mboy arýpa?', es: '¿Cuántos años?', words: [w('mbohapy', 'tres', 'n3', ['mbo', 'ha', 'py']), w('poteĩ', 'seis', 'n6', ['po', 'teĩ']), w('poapy', 'ocho', 'n8', ['po', 'a', 'py']), w('pa', 'diez', 'n10')],
          say: [{ gn: 'Mboy arýpa reguereko?', es: '¿Cuántos años tenés?' }, { gn: 'Aguereko … ary.', es: 'Tengo … años. (decí tu edad)' }] }
      ] },
      { n: 7, gn: 'Achegety', es: 'El alfabeto: las vocales y el puso', nights: [
        { gn: 'A, e, i, o, u, y', es: 'Las vocales orales', letters: 'first', words: [w('avati', 'maíz', 'avati', ['a', 'va', 'ti']), w('Eichu', 'las Siete Cabrillas', 'eichu', ['Ei', 'chu']), w('ita', 'piedra', 'ita', ['i', 'ta']), w('óga', 'casa', 'óga', ['ó', 'ga']), w("urukure'a", 'lechuza', "urukure'a", ['u', 'ru', 'ku', 're', "'a"]), w('y', 'agua', 'y')],
          games: { L1: ['meet', 'letters', 'build'], L2: ['meet', 'letters', 'say'], BI: ['meet', 'letters', 'build'] } },
        { gn: 'Ã, ẽ, ĩ, õ, ũ, ỹ', es: 'Las vocales nasales', letters: 'nasal', words: [w('pytã', 'rojo', 'c-pytã', ['py', 'tã']), w("ñe'ẽ", 'palabra, lengua', "ñe'ẽ", ['ñe', "'ẽ"]), w('tĩ', 'nariz', 'tĩ'), w('mokõi', 'dos', 'n2', ['mo', 'kõi']), w('pytũ', 'oscuro', 'pytũ', ['py', 'tũ']), w('tapỹi', 'rancho', 'tapỹi', ['ta', 'pỹi'])],
          games: { L1: ['meet', 'letters', 'build'], L2: ['meet', 'letters', 'say'], BI: ['meet', 'letters', 'build'] } },
        { gn: 'Puso', es: "El puso ( ' )", letters: 'puso', words: [w("ka'i", 'mono', "ka'i", ['ka', "'i"]), w("so'o", 'carne', "so'o", ['so', "'o"]), w("mandi'o", 'mandioca', "mandi'o", ['ma', 'ndi', "'o"])],
          games: { L1: ['meet', 'letters', 'build'], L2: ['meet', 'pick', 'say'], BI: ['meet', 'letters', 'build'] } }
      ] },
      { n: 8, gn: 'Ñande yvága', es: 'Nuestro cielo, de la mañana a la noche', nights: [
        { gn: 'Kuarahy ha jasy', es: 'El sol y la luna', words: [w('kuarahy', 'sol', 'kuarahy', ['kua', 'ra', 'hy']), w('jasy', 'luna', 'jasy', ['ja', 'sy']), w('mbyja', 'estrella', 'mbyja', ['mby', 'ja'])] },
        { gn: 'Pyhareve, ka\'aru, pyhare', es: 'La mañana, la tarde y la noche', words: [w('pyhareve', 'la mañana', "ko'ẽ", ['py', 'ha', 're', 've']), w("ka'aru", 'la tarde', "ka'aru", ['ka', "'a", 'ru']), w('pyhare', 'la noche', 'pyhare', ['py', 'ha', 're'])] },
        { gn: 'Mborevi Rape', es: 'El camino del tapir', story: 'rape', words: [w('Mborevi Rape', 'la Vía Láctea', 'mborevirape'), w('Eichu', 'las Siete Cabrillas', 'eichu', ['Ei', 'chu']), w('Ñandu Pysã', 'la Cruz del Sur', 'nandupysa')],
          games: { all: ['meet', 'story', 'pairs'] } }
      ] }
    ] },

    /* ---------- 2.º grado · Ñandu Pysã: animals, food and needs are written; for L2, reading and writing count from here ---------- */
    g2: { units: [
      { n: 1, gn: 'Mymbakuéra', es: 'Los animales', nights: [
        { gn: 'Mymba ógape', es: 'Animales de la casa', words: [w('jagua', 'perro', 'jagua', ['ja', 'gua']), w('mbarakaja', 'gato', 'mbarakaja', ['mba', 'ra', 'ka', 'ja']), w('ryguasu', 'gallina', 'ryguasu', ['ry', 'gua', 'su']), w('ype', 'pato', 'ype', ['y', 'pe'])] },
        { gn: "Mymba ka'aguýpe", es: 'Animales del monte', words: [w("ka'i", 'mono', "ka'i", ['ka', "'i"]), w('tatu', 'tatú', 'tatu', ['ta', 'tu']), w('jaguarete', 'yaguareté', 'jaguarete', ['ja', 'gua', 're', 'te']), w('kururu', 'sapo', 'kururu', ['ku', 'ru', 'ru'])] },
        { gn: 'Mymba yvágape', es: 'Animales que están en el cielo', words: [w('ñandu guasu', 'ñandú', 'ñandu guasu'), w('guasu', 'venado', 'guasu', ['gua', 'su']), w('mborevi', 'tapir', 'mborevi', ['mbo', 're', 'vi'])] }
      ] },
      { n: 2, gn: "Tembi'u", es: 'La comida', nights: [
        { gn: "Chipa ha mandi'o", es: 'Chipa y mandioca', words: [w('chipa', 'chipá', 'chipa', ['chi', 'pa']), w("mandi'o", 'mandioca', "mandi'o", ['ma', 'ndi', "'o"]), w('avati', 'maíz', 'avati', ['a', 'va', 'ti'])] },
        { gn: 'Y ha kamby', es: 'Agua y leche', words: [w('y', 'agua', 'y'), w('kamby', 'leche', 'kamby', ['ka', 'mby']), w('mbujape', 'pan', 'mbujape', ['mbu', 'ja', 'pe'])] },
        { gn: 'Yva ha mbeju', es: 'Frutas y mbeju', words: [w('narã', 'naranja', 'narã', ['na', 'rã']), w('pakova', 'banana', 'pakova', ['pa', 'ko', 'va']), w('mbeju', 'mbejú', 'mbeju', ['mbe', 'ju'])] }
      ] },
      { n: 3, gn: 'Aikotevẽ', es: 'Pedir lo que necesito', nights: [
        { gn: "Hay'use, akaruse", es: 'Pedir agua y comida', words: [w("Hay'use", 'Quiero tomar agua', 'y', ['Ha', 'y', "'u", 'se']), w('Akaruse', 'Quiero comer', 'karu', ['A', 'ka', 'ru', 'se']), w("Eme'ẽmína chéve mbujape", 'Dame pan, por favor', 'mbujape')],
          say: [{ gn: "Mbo'ehára, akaruse.", es: 'Maestra, quiero comer.' }, { gn: 'Ejapyhy ko mbujape.', es: 'Tomá este pan.' }, { gn: 'Aguyje!', es: '¡Gracias!' }] },
        { gn: 'Ikatúpa asẽ?', es: 'Ir al baño y pedir permiso', words: [w("Ikatúpa asẽ sapy'aite?", '¿Puedo salir un ratito? (al baño)', 'baño'), w("Ikatúpa hay'u?", '¿Puedo tomar agua?', 'y'), w('Ikatúpa akaru?', '¿Puedo comer?', 'karu')],
          say: [{ gn: "Ikatúpa asẽ sapy'aite?", es: '¿Puedo salir un ratito? (al baño)' }, { gn: 'Héẽ, ikatu.', es: 'Sí, podés.' }, { gn: "Aguyje, mbo'ehára.", es: 'Gracias, maestra.' }] },
        { gn: 'Ejapyhy', es: 'Prestar algo', words: [w('mbogueha', 'borrador', 'mbogueha', ['mbo', 'gue', 'ha']), w('Ejapyhy', 'Tomá', 'ejapyhy', ['E', 'ja', 'py', 'hy']), w('Eiporu che haiha', 'Usá mi lápiz', 'haiha')],
          say: [{ gn: 'Aikotevẽ mbogueha.', es: 'Necesito un borrador.' }, { gn: 'Ejapyhy che mbogueha.', es: 'Tomá mi borrador.' }, { gn: 'Aguyjevete, che irũ!', es: '¡Muchas gracias, amiga!' }] }
      ] },
      soon(4, 'Pundie', 'Las consonantes: ch, mb, nd, ng, nt, rr, g̃'),
      soon(5, 'Moõpa?', 'Instrucciones: ubicar cosas e ir a un lugar'),
      soon(6, 'Purahéi ha kũjererã', 'Canciones, rimas y trabalenguas')
    ] },

    /* ---------- 3.º to 9.º grado: their units, nights in preparation ---------- */
    g3: { units: [
      soon(1, '', 'Instrucciones: usar objetos y aparatos'),
      soon(2, "Mombe'u", 'Cuentos y fábulas'),
      soon(3, "Mombe'ugua'u", 'Leyendas'),
      soon(4, "Ñe'ẽpoty ha purahéi", 'Poesías y canciones'),
      soon(5, '', 'Adivinanzas y trabalenguas'),
      soon(6, '', 'Describir personas, animales y lugares')
    ] },
    g4: { units: [
      soon(1, "Kuatiañe'ẽ", 'Cartas y esquelas'),
      soon(2, '', 'Describir'),
      soon(3, '', 'Instrucciones orales y escritas'),
      soon(4, "Mba'e porã ha mba'e vai", 'Lo bueno y lo malo'),
      soon(5, '', 'Juegos de antes y de ahora'),
      soon(6, "Ñe'ẽjoaju ha ñe'ẽtéva", 'La oración y el verbo')
    ] },
    g5: { units: [
      soon(1, 'Mborevi Rape', 'El camino del tapir: leyendas del cielo guaraní'),
      soon(2, "Mombe'ugua'u", 'Mitos y leyendas'),
      soon(3, "Ñe'ẽpoty", 'Poesía'),
      soon(4, '', 'Sentimientos y palabras contrarias'),
      soon(5, '', 'Dónde va el acento'),
      soon(6, '', 'Mío, tuyo, nuestro: los posesivos')
    ] },
    g6: { units: [
      soon(1, 'Marandu', 'Noticias de la radio y la tele'),
      soon(2, '', 'Los personajes de un cuento'),
      soon(3, '', 'Leer entre líneas'),
      soon(4, '', 'Los pronombres'),
      soon(5, "Ñe'ẽtéva", 'Conjugar el verbo'),
      soon(6, '', 'Lo que cuentan los abuelos')
    ] },
    g7: { units: [
      soon(1, '', 'Relatos y leyendas'), soon(2, '', 'Poesía guaraní'), soon(3, '', 'La noticia'),
      soon(4, '', 'El verbo y sus tiempos'), soon(5, '', 'La entrevista'), soon(6, '', 'Teatro')
    ] },
    g8: { units: [
      soon(1, '', 'El cuento'), soon(2, '', 'El ensayo breve'), soon(3, '', 'Debatir'),
      soon(4, '', 'Traducir entre guaraní y castellano'), soon(5, '', 'Escritores en guaraní')
    ] },
    g9: { units: [
      soon(1, '', 'Literatura paraguaya en guaraní'), soon(2, '', 'Argumentar por escrito'), soon(3, '', 'Los medios en guaraní'),
      soon(4, '', 'El alfabeto y la Academia'), soon(5, '', 'La escritura formal'), soon(6, '', 'Proyecto final')
    ] }
  };
})();
