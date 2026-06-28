export interface Palette {
  pindoBg: string;
  pindoFg: string;
  mjiBg: string;
  mjiFg: string;
  accent: string;
  fumboBoxBg: string;
  fumboBoxText: string;
}

export const PALETTES: Record<string, Palette> = {
  yellow_navy: {
    pindoBg: '#E8C820', pindoFg: '#8B1A1A',
    mjiBg: '#1B2244', mjiFg: '#C62828',
    accent: '#C99846',
    fumboBoxBg: '#E8C820', fumboBoxText: '#1B2244',
  },
  white_red: {
    pindoBg: '#FFFFFF', pindoFg: '#C62828',
    mjiBg: '#E8C820', mjiFg: '#8B1A1A',
    accent: '#1A1A1A',
    fumboBoxBg: '#FFFFFF', fumboBoxText: '#1A1A1A',
  },
  magenta_yellow: {
    pindoBg: '#E8C820', pindoFg: '#1A1A1A',
    mjiBg: '#B5246A', mjiFg: '#2D5F1A',
    accent: '#1A1A1A',
    fumboBoxBg: '#1A1A1A', fumboBoxText: '#E8C820',
  },
  black_gold: {
    pindoBg: '#1A1A1A', pindoFg: '#C99846',
    mjiBg: '#D4A030', mjiFg: '#8B1A1A',
    accent: '#C62828',
    fumboBoxBg: '#D4A030', fumboBoxText: '#1A1A1A',
  },
  green_orange: {
    pindoBg: '#1B6B3A', pindoFg: '#E87830',
    mjiBg: '#FFFFFF', mjiFg: '#1B6B3A',
    accent: '#E87830',
    fumboBoxBg: '#FFFFFF', fumboBoxText: '#1A1A1A',
  },
  red_magenta: {
    pindoBg: '#E0E0D8', pindoFg: '#C62828',
    mjiBg: '#C62828', mjiFg: '#E87830',
    accent: '#D4457A',
    fumboBoxBg: '#E0E0D8', fumboBoxText: '#1A1A1A',
  },
  black_red: {
    pindoBg: '#1A1A1A', pindoFg: '#C62828',
    mjiBg: '#1A1A1A', mjiFg: '#C62828',
    accent: '#FFFFFF',
    fumboBoxBg: '#1A1A1A', fumboBoxText: '#FFFFFF',
  },
  orange_black: {
    pindoBg: '#FFFFFF', pindoFg: '#1A1A1A',
    mjiBg: '#E8A832', mjiFg: '#1A1A1A',
    accent: '#1A1A1A',
    fumboBoxBg: '#FFFFFF', fumboBoxText: '#1A1A1A',
  },
  red_navy: {
    pindoBg: '#1B2244', pindoFg: '#C99846',
    mjiBg: '#C62828', mjiFg: '#1B2244',
    accent: '#C99846',
    fumboBoxBg: '#C99846', fumboBoxText: '#1B2244',
  },
  pink_gold: {
    pindoBg: '#E8A832', pindoFg: '#C62828',
    mjiBg: '#D4457A', mjiFg: '#FFFFFF',
    accent: '#E07A5F',
    fumboBoxBg: '#E8A832', fumboBoxText: '#1A1A1A',
  },
};

export const PALETTE_KEYS = Object.keys(PALETTES);
