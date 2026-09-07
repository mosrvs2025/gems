/* Gem Studio — vocabulary + presets.
   Plain classic script (no modules) so docs/index.html works from file:// too. */

window.GEM_DATA = (function () {
  const KEYS = [
    'A minor','A major','B minor','B major','C minor','C major','C# minor',
    'D minor','D major','E minor','E major','F minor','F major','F# minor',
    'G minor','G major','Bb major','Eb major','Ab major','D# minor'
  ];

  const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '12/8', '7/8', '5/4'];

  /* Tempo landmarks used by the BPM slider's contextual label. */
  const TEMPO_ZONES = [
    { max: 69,  label: 'ballad / dirge' },
    { max: 84,  label: 'downtempo sway' },
    { max: 99,  label: 'boom-bap pocket' },
    { max: 114, label: 'mid-tempo groove' },
    { max: 129, label: 'driving / house-adjacent' },
    { max: 149, label: 'uptempo, urgent' },
    { max: 999, label: 'double-time / drum & bass' }
  ];

  const GENRES = [
    'dreamcore hip-hop','cinematic electronica','downtempo trap','orchestral pop',
    'synthwave','neo-soul','indie folk','alt R&B','drill','reggaeton','bolero trap',
    'ambient post-rock','future garage','bedroom pop','corrido tumbado','lo-fi jazz',
    'gospel house','industrial pop','flamenco fusion','shoegaze'
  ];

  const MOODS = [
    'nocturnal','euphoric','aching','defiant','tender','hypnotic','triumphant',
    'restless','sun-bleached','haunted','reverent','playful','stoic','feverish'
  ];

  const INSTRUMENTS = [
    'felt piano','warm pads','analog sub','violin swarm','crisp drums','nylon guitar',
    'vapor pads','808s','sax','rhodes','harp','choir','marimba','upright bass',
    'modular bleeps','tape strings','cello','brass stabs','requinto','steel drums',
    'church organ','hand percussion','glass harmonica','distorted guitar'
  ];

  const VOCAL_PLANS = [
    'male rap (EN) + female ethereal hook (ES)',
    'female ethereal EN/ES',
    'male rap, single voice',
    'female lead with layered harmony stack',
    'call-and-response duet',
    'whispered verse, belted chorus',
    'spoken-word verse into sung hook',
    'unison group chant chorus'
  ];

  const ART_STYLES = [
    'cinematic photo-illustration','watercolor','cyberpunk','claymation','risograph print',
    'oil painting','collage / mixed media','35mm film still','vector minimal','airbrushed 70s sci-fi'
  ];

  const LENSES = [
    '50mm, shallow DOF','35mm, rule of thirds','85mm portrait compression',
    '24mm wide, slight distortion','macro, extreme detail','anamorphic, wide flare'
  ];

  const PALETTES = [
    { name: 'Neon Rain',    colors: ['teal', 'magenta', 'amber'] },
    { name: 'Baja Dusk',    colors: ['coral', 'midnight blue', 'sand'] },
    { name: 'Cold Chrome',  colors: ['steel grey', 'ice blue', 'white'] },
    { name: 'Ember',        colors: ['ember orange', 'char black', 'bone'] },
    { name: 'Bloom',        colors: ['blush pink', 'sage', 'cream'] },
    { name: 'Deep Water',   colors: ['abyss navy', 'seafoam', 'pearl'] },
    { name: 'Gold Hour',    colors: ['honey gold', 'dust rose', 'olive'] },
    { name: 'Voltage',      colors: ['acid green', 'violet', 'jet'] }
  ];

  const ARRANGEMENTS = [
    { name: 'Standard',   map: 'Intro → V1 → Pre → Chorus → V2 → Pre → Chorus → Bridge → Final Chorus → Outro' },
    { name: 'Drop-first', map: 'Cold Open Hook → V1 → Pre → Chorus → V2 → Chorus → Drop → Final Chorus → Outro' },
    { name: 'Slow burn',  map: 'Intro → V1 → V2 → Pre → Chorus → Bridge → Final Chorus → Outro' },
    { name: 'Two-hander', map: 'Intro → V1 (A) → Chorus → V2 (B) → Chorus → Bridge (duet) → Final Chorus → Outro' },
    { name: 'Loop-based', map: 'Loop In → Verse → Hook → Verse → Hook → Break → Hook x2 → Loop Out' }
  ];

  const LANGUAGE_MODES = [
    { id: 'en',        label: 'English only',   note: 'All lines in English.' },
    { id: 'es',        label: 'Español only',   note: 'All lines in Spanish.' },
    { id: 'bilingual', label: 'Bilingual EN/ES', note: 'Alternate EN/ES; keep the hook memorable in both.' }
  ];

  /* The four files the Gem returns. `required` sections are what the Decode tab checks for. */
  const FILES = [
    { id: 'title.md',       label: 'Title',       icon: '✎', required: ['# Title'] },
    { id: 'description.md', label: 'Description', icon: '◆', required: ['# Description', '## Sonic Architecture', '**Tempo:**', '**Key:**', '**Style:**', '**Arrangement Map:**'] },
    { id: 'lyrics.md',      label: 'Lyrics',      icon: '♪', required: ['[Intro]', '[Verse 1]', '[Pre-Chorus]', '[Chorus]', '[Verse 2]', '[Bridge]', '[Final Chorus]', '[Outro]'] },
    { id: 'cover-art.md',   label: 'Cover art',   icon: '▣', required: ['# Album Cover'] }
  ];

  /* One-click starting points. Each is a partial patch over the default state. */
  const RECIPES = [
    {
      name: 'Neon Nocturne',
      blurb: 'Rain-slick city, bilingual hook, strings that bloom on the chorus.',
      patch: { concept: 'a city that only speaks at night', genres: ['dreamcore hip-hop','cinematic electronica'],
        moods: ['nocturnal','aching'], key: 'A minor', bpm: 96, language: 'bilingual',
        instruments: ['felt piano','warm pads','analog sub','violin swarm','crisp drums'],
        vocalPlan: 'male rap (EN) + female ethereal hook (ES)', arrangement: 'Standard',
        artStyle: 'cinematic photo-illustration', palette: 'Neon Rain', lens: '50mm, shallow DOF' }
    },
    {
      name: 'Desert Drift',
      blurb: 'Half-time trap under a melting horizon. Whispered, wide, warm.',
      patch: { concept: 'driving the coast road until the sun gives up', genres: ['downtempo trap'],
        moods: ['sun-bleached','hypnotic'], key: 'D minor', bpm: 82, language: 'bilingual',
        instruments: ['nylon guitar','vapor pads','analog sub','hand percussion'],
        vocalPlan: 'whispered verse, belted chorus', arrangement: 'Slow burn',
        artStyle: 'watercolor', palette: 'Baja Dusk', lens: '35mm, rule of thirds' }
    },
    {
      name: 'Cathedral Rave',
      blurb: 'Gospel house with an organ that refuses to apologize.',
      patch: { concept: 'forgiveness arriving at 4am on a dancefloor', genres: ['gospel house'],
        moods: ['euphoric','reverent'], key: 'F minor', bpm: 124, language: 'en',
        instruments: ['church organ','choir','crisp drums','analog sub','brass stabs'],
        vocalPlan: 'unison group chant chorus', arrangement: 'Drop-first',
        artStyle: 'risograph print', palette: 'Voltage', lens: '24mm wide, slight distortion' }
    },
    {
      name: 'Paper Heart',
      blurb: 'Just a voice, a room, and one honest verse. Nothing to hide behind.',
      patch: { concept: 'the last thing you never said out loud', genres: ['indie folk'],
        moods: ['tender','haunted'], key: 'C major', bpm: 68, language: 'en',
        instruments: ['nylon guitar','cello','tape strings'],
        vocalPlan: 'female lead with layered harmony stack', arrangement: 'Slow burn',
        artStyle: '35mm film still', palette: 'Bloom', lens: '85mm portrait compression' }
    },
    {
      name: 'Static Saint',
      blurb: 'Industrial pop with teeth. Built for a chorus that distorts on purpose.',
      patch: { concept: 'becoming the machine you were warned about', genres: ['industrial pop','synthwave'],
        moods: ['defiant','feverish'], key: 'E minor', bpm: 138, language: 'en',
        instruments: ['distorted guitar','808s','modular bleeps','crisp drums'],
        vocalPlan: 'spoken-word verse into sung hook', arrangement: 'Drop-first',
        artStyle: 'cyberpunk', palette: 'Cold Chrome', lens: 'anamorphic, wide flare' }
    },
    {
      name: 'Verano Lento',
      blurb: 'Reggaetón slowed to a heartbeat. Salt air, long shadows.',
      patch: { concept: 'a summer you keep re-reading like a letter', genres: ['reggaeton','bolero trap'],
        moods: ['playful','aching'], key: 'G minor', bpm: 92, language: 'es',
        instruments: ['requinto','hand percussion','analog sub','vapor pads'],
        vocalPlan: 'call-and-response duet', arrangement: 'Loop-based',
        artStyle: 'collage / mixed media', palette: 'Gold Hour', lens: 'macro, extreme detail' }
    }
  ];

  /* Seeds for the dice button — deliberately oblique so they spark rather than dictate. */
  const CONCEPT_SEEDS = [
    'a payphone that still rings in a town nobody lives in',
    'the exact second a crowd becomes one animal',
    'inheriting your mother’s handwriting',
    'two people agreeing to lie about being fine',
    'the tide taking back something you buried',
    'a lighthouse keeper who has never seen a ship',
    'learning a language just to say one sentence',
    'the quiet after a siren passes',
    'a house that remembers more than you do',
    'the last train, and choosing not to run for it',
    'a photograph nobody in it is still speaking to',
    'sunrise arriving whether or not you slept'
  ];

  const DEFAULT_STATE = {
    concept: '',
    genres: ['dreamcore hip-hop'],
    moods: ['nocturnal'],
    key: 'A minor',
    bpm: 96,
    timeSignature: '4/4',
    language: 'bilingual',
    instruments: ['felt piano','warm pads','analog sub','crisp drums'],
    vocalPlan: 'male rap (EN) + female ethereal hook (ES)',
    arrangement: 'Standard',
    artStyle: 'cinematic photo-illustration',
    palette: 'Neon Rain',
    lens: '50mm, shallow DOF',
    files: ['title.md','description.md','lyrics.md','cover-art.md'],
    radioClean: true,
    generateImage: true,
    avoidProperNouns: true,
    referenceSlugs: [],
    iterateNote: '',
    extraNotes: ''
  };

  return {
    KEYS, TIME_SIGNATURES, TEMPO_ZONES, GENRES, MOODS, INSTRUMENTS, VOCAL_PLANS,
    ART_STYLES, LENSES, PALETTES, ARRANGEMENTS, LANGUAGE_MODES, FILES, RECIPES,
    CONCEPT_SEEDS, DEFAULT_STATE
  };
})();
