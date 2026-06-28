export interface Palette {
  pindoBg: string;
  pindoFg: string;
  mjiBg: string;
  mjiFg: string;
  accent: string;
  jinaBoxBg: string;
  jinaBoxText: string;
}

export const PALETTES: Record<string, Palette> = {
  red_navy: {
    pindoBg: '#1B2244', pindoFg: '#C99846',
    mjiBg: '#C62828', mjiFg: '#1B2244',
    accent: '#C99846',
    jinaBoxBg: '#C99846', jinaBoxText: '#1B2244',
  },
  yellow_navy: {
    pindoBg: '#E8C820', pindoFg: '#8B1A1A',
    mjiBg: '#1B2244', mjiFg: '#C62828',
    accent: '#C99846',
    jinaBoxBg: '#E8C820', jinaBoxText: '#1B2244',
  },
  white_red: {
    pindoBg: '#FFFFFF', pindoFg: '#C62828',
    mjiBg: '#E8C820', mjiFg: '#8B1A1A',
    accent: '#1A1A1A',
    jinaBoxBg: '#FFFFFF', jinaBoxText: '#1A1A1A',
  },
  pink_gold: {
    pindoBg: '#E8A832', pindoFg: '#C62828',
    mjiBg: '#D4457A', mjiFg: '#FFFFFF',
    accent: '#E07A5F',
    jinaBoxBg: '#E8A832', jinaBoxText: '#1A1A1A',
  },
  magenta_yellow: {
    pindoBg: '#E8C820', pindoFg: '#1A1A1A',
    mjiBg: '#B5246A', mjiFg: '#2D5F1A',
    accent: '#1A1A1A',
    jinaBoxBg: '#1A1A1A', jinaBoxText: '#E8C820',
  },
  black_gold: {
    pindoBg: '#1A1A1A', pindoFg: '#C99846',
    mjiBg: '#D4A030', mjiFg: '#8B1A1A',
    accent: '#C62828',
    jinaBoxBg: '#D4A030', jinaBoxText: '#1A1A1A',
  },
  green_orange: {
    pindoBg: '#1B6B3A', pindoFg: '#E87830',
    mjiBg: '#FFFFFF', mjiFg: '#1B6B3A',
    accent: '#E87830',
    jinaBoxBg: '#FFFFFF', jinaBoxText: '#1A1A1A',
  },
  red_magenta: {
    pindoBg: '#E0E0D8', pindoFg: '#C62828',
    mjiBg: '#C62828', mjiFg: '#E87830',
    accent: '#D4457A',
    jinaBoxBg: '#E0E0D8', jinaBoxText: '#1A1A1A',
  },
  black_red: {
    pindoBg: '#1A1A1A', pindoFg: '#C62828',
    mjiBg: '#1A1A1A', mjiFg: '#C62828',
    accent: '#FFFFFF',
    jinaBoxBg: '#1A1A1A', jinaBoxText: '#FFFFFF',
  },
  orange_black: {
    pindoBg: '#FFFFFF', pindoFg: '#1A1A1A',
    mjiBg: '#E8A832', mjiFg: '#1A1A1A',
    accent: '#1A1A1A',
    jinaBoxBg: '#FFFFFF', jinaBoxText: '#1A1A1A',
  },
};

export const PALETTE_KEYS = Object.keys(PALETTES);
