const DIGO_ANIMALS = [
  'Simba',      // lion
  'Nyoka',      // snake
  'Kobe',       // tortoise
  'Nyuni',      // bird
  'Ngombe',     // cow
  'Mbuzi',      // goat
  'Kuku',       // chicken
  'Paka',       // cat
  'Mbwa',       // dog
  'Ngamia',     // camel
  'Tembo',      // elephant
  'Pundamilia', // zebra
  'Kiboko',     // hippo
  'Nyumbu',     // wildebeest
  'Sungura',    // rabbit
  'Paa',        // gazelle
  'Kima',       // monkey
  'Tai',        // eagle
  'Bundi',      // owl
  'Chui',       // leopard
  'Fisi',       // hyena
  'Popo',       // bat
  'Nungunungu', // porcupine
  'Pweza',      // octopus
  'Kaa',        // crab
  'Samaki',     // fish
  'Nyangumi',   // whale
  'Kasuku',     // parrot
  'Mwewe',      // hawk
  'Panzi',      // grasshopper
  'Nondo',      // moth
  'Konokono',   // snail
  'Nyati',      // buffalo
  'Kifaru',     // rhino
  'Twiga',      // giraffe
  'Swala',      // impala
  'Pofu',       // eland
  'Duma',       // cheetah
  'Mbega',      // colobus monkey
  'Tumbili',    // vervet monkey
  'Sokwe',      // chimpanzee
  'Nyani',      // baboon
  'Komba',      // bushbaby
  'Ngedere',    // monkey (generic)
  'Nguruwe',    // pig
  'Kondoo',     // sheep
  'Punda',      // donkey
  'Farasi',     // horse
  'Ndovu',      // elephant (alt)
  'Mbweha',     // fox/jackal
  'Nguchiro',   // mongoose
  'Fungo',      // civet
  'Siku',       // genet
  'Pimbi',      // hyrax
  'Pelele',     // dormouse
  'Sengi',      // elephant shrew
  'Panya',      // mouse/rat
  'Buku',       // large rat
  'Kicheche',   // zorilla
  'Nyegere',    // honey badger
  'Funo',       // squirrel
  'Kuro',       // waterbuck
  'Topi',       // topi antelope
  'Korongo',    // roan antelope
  'Palahala',   // sable antelope
  'Tandala',    // kudu
  'Mhongo',     // bushbuck
  'Dik-dik',    // dik-dik
  'Ngorombwe',  // duiker
  'Orobi',      // oribi
  'Mbawala',    // reedbuck
  'Ngiri',      // warthog
  'Bweha',      // jackal
  'Mbwa-mwitu', // wild dog
  'Hongo',      // python (large)
  'Swila',      // black mamba
  'Kipiri',     // viper
  'Kijani',     // green mamba
  'Moma',       // cobra
  'Mjusi',      // lizard
  'Kenge',      // monitor lizard
  'Kakakuona',  // chameleon
  'Mamba',      // crocodile
  'Ngwena',     // crocodile (alt)
  'Kinyonga',   // chameleon (alt)
  'Tandu',      // centipede
  'Jongoo',     // millipede
  'Buibui',     // spider
  'Nge',        // scorpion
  'Nyigu',      // wasp
  'Nyuki',      // bee
  'Nzi',        // fly
  'Mbu',        // mosquito
  'Kipepeo',    // butterfly
  'Dudu',       // insect
  'Mende',      // cockroach
  'Sisimizi',   // ant
  'Mchwa',      // termite
  'Jibini',     // bedbug
  'Chungwa',    // ladybug
  'Papasi',     // tick
  'Kombamwiko',  // praying mantis
  'Korobai',    // dragonfly
  'Sururu',     // mussel
  'Chaza',      // oyster
  'Kambare',    // catfish
  'Chewa',      // sea fish
  'Papa',       // shark
  'Taa',        // ray
  'Pono',       // blowfish
  'Nguru',      // swordfish
  'Dagaa',      // sardine
  'Kambale',    // lungfish
  'Sangara',    // Nile perch
  'Sato',       // tilapia
  'Mkunga',     // eel
  'Kasa',       // sea turtle
  'Ngamba',     // turtle (freshwater)
  'Pandu',      // donkey fish
  'Tumbusi',    // maggot fly
  'Kunguni',    // bedbug (alt)
  'Mrija',      // leech
  'Chatu',      // python
  'Ngao',       // shield bug
  'Korongo',    // crane/stork
  'Hondohondo', // turkey
  'Bata',       // duck
  'Bukini',     // goose
  'Kanga',      // guinea fowl
  'Kwale',      // francolin
  'Koikoi',     // sandpiper
  'Shakwe',     // heron
  'Flamingo',   // flamingo
  'Mwewe',      // kite (bird)
  'Kipanga',    // falcon
  'Kozi',       // osprey
  'Tumbusi',    // vulture (alt)
  'Gugu',       // vulture
  'Kunguru',    // crow
  'Kwenzi',     // raven
  'Shomoro',    // sparrow
  'Kidevu',     // robin
  'Kurumbiza',  // sunbird
  'Karanga',    // hornbill
  'Toko',       // hornbill (alt)
  'Mbuni',      // ostrich
  'Tausi',      // peacock
  'Tusi',       // dove
  'Njiwa',      // pigeon
  'Tetere',     // weaver bird
  'Kwezi',      // coucal
  'Hudhudhuu',  // hoopoe
  'Kororo',     // nightjar
  'Pukupuku',   // quail
  'Kururu',     // frog
  'Chura',      // toad
  'Kererwe',    // tree frog
  'Mjoka',      // worm/serpent
  'Kalulu',     // hare
  'Nungu',      // porcupine (alt)
  'Kanga',      // guinea fowl (alt)
  'Shirazi',    // local cat
  'Ndege',      // bird (generic)
  'Dondoro',    // snipe
  'Pomboo',     // dolphin
  'Nguva',      // dugong
  'Bunduki',    // pelican
  'Gogoni',     // hermit crab
  'Jibwa',      // sand crab
  'Kochi',      // lobster
  'Kombeo',     // prawn
  'Susu',       // dolphin (river)
  'Viboko',     // hippos
  'Boko',       // monitor (alt)
  'Dondoo',     // woodpecker
  'Hwambe',     // flying squirrel
  'Bweha',      // side-striped jackal
  'Kakara',     // hedgehog
  'Kibirizi',   // shrew
  'Mbisi',      // jackal (alt)
  'Tumbe',      // tern
  'Chiriku',    // bulbul
  'Zuzu',       // kingfisher
  'Chozi',      // plover
  'Mdomo',      // stork
  'Kisanga',    // egret
  'Bweko',      // bat (fruit)
  'Wandu',      // caterpillar
  'Kombora',    // beetle
  'Madevu',     // caterpillar (hairy)
];

export function anonymousDisplayName(anonymousId: string): string {
  let hash = 0;
  for (let i = 0; i < anonymousId.length; i++) {
    hash = ((hash << 5) - hash + anonymousId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % DIGO_ANIMALS.length;
  return DIGO_ANIMALS[index];
}
