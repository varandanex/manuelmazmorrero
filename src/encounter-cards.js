// Original game-show copy describes the implemented attacks, not book abilities.
export const ENCOUNTER_CARDS = {
  grunt: {
    name: 'Goblin', art: 'enemy-goblin', tagline: 'Recursos inhumanos.',
    attack: 'Puñalada de bienvenida',
    description: 'Te persigue y hace daño al tocarte. Hospitalidad de la casa.',
    tip: 'Golpea con el paraguas antes de que llegue.',
  },
  bat: {
    name: 'Desperdigador', art: 'enemy-scatterer', tagline: 'Pequeño. Rápido. Un puto incordio.',
    attack: 'Asalto relámpago',
    description: 'Se acerca rápido, zigzaguea y te golpea al contacto.',
    tip: 'Mantén la distancia y barre con el paraguas.',
  },
  caster: {
    name: 'Llama maligna', art: 'enemy-evil-llama', tagline: 'No viene a escupir opiniones.',
    attack: 'Salivazo del infierno',
    description: 'Dispara desde lejos y retrocede cuando te acercas.',
    tip: 'Esquiva de lado y acércate entre disparos.',
  },
  drek: {
    name: 'Drek', art: 'enemy-drek', tagline: 'Tamaño de bolsillo. Mala leche industrial.',
    attack: 'Dentellada exprés',
    description: 'Te persigue deprisa y en zigzag. La dentadura no es decorativa.',
    tip: 'No te dejes rodear: golpea y sigue moviéndote.',
  },
  jikininki: {
    name: 'Jikininki', art: 'enemy-jikininki', tagline: 'Limpieza de pasajeros. Contigo dentro.',
    attack: 'Fregona de demolición',
    description: 'Se acerca despacio y marca un círculo antes de soltar el golpe.',
    tip: 'Sal del círculo. Ataca cuando se quede agotado.',
  },
  acid: {
    name: 'Empalador ácido rastrero', art: 'enemy-acid-crawler', tagline: 'El quitamanchas que también te quita a ti.',
    attack: 'Escupitajo corrosivo',
    description: 'Lanza ácido verde a distancia y se aparta si te acercas.',
    tip: 'Muévete de lado y acorta distancias entre disparos.',
  },
  engineer: {
    name: 'Ingeniero goblin', art: 'enemy-goblin-engineer', tagline: 'Obras sin licencia. Atropellos incluidos.',
    attack: 'Reforma integral de costillas',
    description: 'Marca una dirección y embiste con la apisonadora. No gira a mitad de carga.',
    tip: 'Apártate de la línea y golpea cuando frene.',
  },
  rat: {
    name: 'Rata', art: 'enemy-rat', tagline: 'Inspección de sanidad: suspendida.',
    attack: 'Mordisco sin cita previa',
    description: 'Te persigue, fija una dirección y salta en línea recta tras el aviso.',
    tip: 'Esquiva de lado y dale un paraguazo cuando aterrice.',
  },
  wallwatch: {
    name: 'Vigilante de pared', art: 'enemy-wallwatch', tagline: 'La pared tiene ojos. Y dientes.',
    attack: 'Ronda por el flanco',
    description: 'Se acerca por un lado en vez de seguirte en línea recta. Hiere al contacto.',
    tip: 'No te encierres en una esquina: deja una salida a tu espalda.',
  },
  woodcutter: {
    name: 'Mono talador', art: 'enemy-woodcutter', tagline: 'Tu paraguas tiene mango de madera. Mala suerte.',
    attack: 'Poda de extremidades',
    description: 'Se acerca y marca un círculo antes de descargar el hacha. Después necesita recuperarse.',
    tip: 'Sal de la marca y vuelve cuando falle el hachazo.',
  },
  bramble: {
    name: 'Abrojo psicópata', art: 'enemy-bramble', tagline: 'No acariciar. Ni con un palo.',
    attack: 'Abanico de mala leche',
    description: 'Avanza despacio, fija su puntería y lanza tres púas en abanico tras el aviso.',
    tip: 'Muévete fuera del abanico y ataca durante la recuperación.',
  },
  coal: {
    name: 'Motor de carbón', art: 'enemy-coal', tagline: 'Calefacción central. Funeral individual.',
    attack: 'Recargo por cremación',
    description: 'Marca tu posición y la convierte en una zona de fuego durante un instante.',
    tip: 'Sal del círculo y no vuelvas hasta que se apague.',
  },
  nightweasel: {
    name: 'Comadreja nocturna exploradora', art: 'enemy-nightweasel', tagline: 'Seis patas. Ninguna buena intención.',
    attack: 'Dentellada en directo',
    description: 'Te persigue y prepara una embestida rápida. La trayectoria queda fijada antes de lanzarse.',
    tip: 'Esquiva de lado. Aprovecha el descanso después de la carga.',
  },
  funeral: {
    name: 'Campana funeraria', art: 'enemy-funeral', tagline: 'El catering ha cogido una lanza.',
    attack: 'Pincho de concursante',
    description: 'Guarda las distancias, apunta y dispara una estocada recta tras el aviso.',
    tip: 'No retrocedas por su línea de tiro: sal de lado y acércate.',
  },
  hobgoblin: {
    name: 'Hobgoblin', art: 'enemy-hobgoblin', tagline: 'Efectos especiales. Secuelas permanentes.',
    attack: 'Bomba de audiencia',
    description: 'Se mantiene lejos y señala dónde caerá una bomba. El círculo no te sigue.',
    tip: 'Abandona la marca y persíguelo mientras se recupera.',
  },
  butcher: {
    name: 'El Juicer', art: 'boss-juicer', tagline: 'HOY, EL ZUMO ERES TÚ.',
    attack: 'Embestida trituradora',
    description: 'Fija tu posición, avisa y carga en línea recta. Sin frenos ni remordimientos.',
    tip: 'Sal de la trayectoria. Ataca durante su recuperación.',
  },
  spore: {
    name: 'La Acaparadora', art: 'boss-hoarder', tagline: 'TU CADÁVER COMBINA CON SUS CORTINAS.',
    attack: 'Colección de desgracias',
    description: 'Dispara en abanico y marca charcos venenosos bajo tus pies.',
    tip: 'Sal de las zonas verdes y busca huecos entre disparos.',
  },
  mantaur: {
    name: 'Humanotauro', art: 'boss-mantaur', tagline: 'DEMASIADOS BRAZOS. CERO MODALES.',
    attack: 'Próxima parada: traumatología',
    description: 'Activa una vía mortal y golpea el suelo a su alrededor. Las marcas avisan.',
    tip: 'Sal de la vía y del círculo. Después, dale con todo.',
  },
  elemental: {
    name: 'Elemental de furia', art: 'boss-rage-elemental', tagline: 'SECADO RÁPIDO. SUPERVIVENCIA OPCIONAL.',
    attack: 'Cremación todo incluido',
    description: 'Marca tres círculos de fuego y lanza una descarga de proyectiles.',
    tip: 'Sal del fuego y acércate cuando se quede agotado.',
  },
  host: {
    name: 'Clon de Krakaren', art: 'boss-krakaren', tagline: 'LA RECLAMACIÓN FINAL.',
    attack: 'Protocolo de exterminio',
    description: 'Se protege con dos emisores y dispara rayos. A media vida renueva el escudo.',
    tip: 'Rompe los emisores y sal de las franjas señaladas.',
  },
};

export function floorEnemyCards(floor) {
  return [...new Set(floor.mobs)].map(type => ({ type, ...ENCOUNTER_CARDS[type] }));
}

export const FLOOR_BRIEFINGS = [
  {
    art: 'room-matadero', stamp: 'SE ABRE LA VEDA',
    text: 'Bajas el último escalón. Huele a lejía, hierro y decisiones irreversibles. Un altavoz te da la bienvenida; algo al fondo afila los cubiertos. La organización ha preparado una recepción inolvidable. Tú has traído un paraguas. Al menos, si salpica, vas equipado.',
  },
  {
    art: 'room-jardin', stamp: 'PROHIBIDO ALIMENTAR A LAS PLANTAS',
    text: 'La puerta del invernadero se cierra a tu espalda. Las raíces crujen y una nube verde convierte respirar en una apuesta. Aquí todo crece gracias a un abono excelente: los concursantes anteriores. Procura no echar raíces, Manolo. Sería una forma muy triste de sentar la cabeza.',
  },
  {
    art: 'room-railway', stamp: 'PRÓXIMA PARADA: MALA IDEA',
    text: 'Llegas a una estación donde nadie espera el tren por gusto. Los raíles zumban, los túneles gruñen y el personal de limpieza te mira como a una mancha pendiente. El próximo servicio va con retraso. Tu muerte, según el panel, sigue en hora.',
  },
  {
    art: 'room-furnace', stamp: 'EL INFIERNO ESTÁ PRECALENTADO',
    text: 'El calor te golpea antes de cruzar la puerta. Entre hornos y tuberías, algo escupe ácido y un motor anuncia reformas sin licencia. La lavandería promete secarte el paraguas en segundos. La letra pequeña menciona tus huesos. Qué detalle: por fin un servicio integral.',
  },
  {
    art: 'room-plato', stamp: 'SONRÍE. ESTÁS EN DIRECTO.',
    text: 'Los focos se encienden. Una ovación grabada celebra que todavía conserves casi todas tus piezas. Has llegado al plató final: cámaras, contratos abusivos y una estrella que no piensa compartir audiencia. Aprieta el paraguas, Manolo. Si cancelan el programa, que sea por daños materiales.',
  },
];
