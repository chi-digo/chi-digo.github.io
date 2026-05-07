# Spec: History Section

## Summary

Extract the "History of the Digo" domain from the culture section into a standalone `/history` route. Add a timeline of key Digo historical events to the history landing page. Move the three existing history articles below the timeline.

---

## 1. Current State

The culture section has 12 domains, one of which is `history` (slug: `"history"`). It contains 3 topics:

| Slug | Title (en) |
|---|---|
| `singwaya` | The Singwaya Migration |
| `scholarly-debates` | Scholarly Debates on Digo Origins |
| `kaya-archaeology` | Kaya Archaeology |

These currently live at `/culture/history/*`. After migration they will live at `/history/*`.

The culture section will go from 12 domains to 11. The nav already has a `/history` link added.

---

## 2. Proposed Structure

```
/history                    -> Timeline + article cards (HistoryIndex)
/history/[topic]            -> Article page (reuse CultureArticle pattern)
```

### Landing page layout (top to bottom):
1. Hero (dark, kaya-deep bg) with eyebrow, title, proverb
2. Timeline section (new component)
3. Article cards (same card grid pattern as culture domains)
4. Footer

### Timeline component:
- Vertical line on the left, event cards on the right
- Each event: year/period label, title, 1-2 sentence description
- Responsive: collapses to full-width cards on mobile
- Same design tokens as the rest of the site

---

## 3. Timeline Data

Events curated from research. Organized into eras for visual grouping.

### Era 1: Origins & Settlement (pre-1500s)

| Period | Title | Description |
|---|---|---|
| c. 100 CE+ | Early Bantu settlement | Archaeological evidence shows continuous Bantu occupation of the Kenyan coastal escarpment, with kaya sites showing settlement hierarchies. |
| c. 1050-1150 | First contact with Muslims | Arab and Persian traders establish settlements along the coast. The Digo begin centuries of interaction with the Islamic world. |
| c. 1200s-1300s | Kongo Mosque built | One of the oldest mosques in East Africa, built with coral stone in Diani by Arab merchants. Rediscovered c. 1700s by Sheikh Mwinyi Kombo. |
| c. 1400s-1500s | Digo settle in present homeland | The Digo establish themselves in the coastal plains and hinterland ridges between Mombasa and Tanga, the first Mijikenda group to depart Shungwaya according to oral tradition. |

### Era 2: The Kaya Period (1500s-1900s)

| Period | Title | Description |
|---|---|---|
| c. 1500s-1600s | Kaya settlements established | Fortified hilltop villages in cleared forest glades become the political, spiritual, and defensive centres of Digo life. |
| 1500-1698 | Portuguese domination | The Portuguese monopolise Indian Ocean trade. Mijikenda communities retreat deeper into hinterland forests to avoid submission. Fort Jesus completed in Mombasa (1596). |
| 1698 | Omani capture Fort Jesus | Saif bin Sultan ends Portuguese rule on the northern Swahili coast. Arab-Digo trade interactions intensify under Omani suzerainty. |
| 1840s-1850s | First Digo convert to Islam | The beginning of a transformation that will make the Digo the only majority-Muslim Mijikenda group. Driven by proximity to Swahili communities, healing practices, and trade. |
| 1875-1884 | Peak of coastal slave trade | An estimated 43,000-47,000 enslaved people constitute ~44% of the coastal population. Shimoni Caves in Kwale serve as holding pens. Many Digo are enslaved; some gain freedom through conversion to Islam. |

### Era 3: Colonial Period (1886-1963)

| Period | Title | Description |
|---|---|---|
| 1886 | Anglo-German Treaty | Britain and Germany divide East Africa, splitting the Digo homeland between two colonial powers. The ten-mile coastal strip is allocated to the Sultan of Zanzibar, making Mijikenda squatters on ancestral land. |
| 1888-1889 | Abushiri Revolt | Coastal rebellion against German rule engulfs Tanga and surrounding Wadigo territory. Led by Abushiri ibn Salim, the uprising draws in Arab, Swahili, and African populations. |
| 1897-1900 | Great Famine and smallpox | Combined famine, drought, locusts, cattle plague, and smallpox devastate the coast. Estimated 50-90% mortality in some areas, weakening communities at the moment of colonial consolidation. |
| 1905-1907 | Maji Maji Rebellion | Major uprising against German forced cotton cultivation in Tanganyika. The Digo around Tanga are among the affected populations. Between 75,000-300,000 die, mostly from German scorched-earth reprisals. |
| 1913-1914 | Giriama Uprising | Mekatilili wa Menza leads Giriama resistance against British forced labour and taxes. Though primarily Giriama, this is the defining Mijikenda anti-colonial event. |
| 1920s | Digo become majority Muslim | Mosques and Quranic schools spread across Kwale. The Digo are the first Mijikenda group to build their own mosques, in villages like Kibiga Kirau and Hormuz. |
| 1940s | Last kayas abandoned | Population growth, trade opportunities, and colonial pressures lead to abandonment of kaya settlements. The forests are preserved as sacred sites and ancestral abodes. |
| 1948 | Digo District renamed Kwale | Administrative change reflecting evolving colonial nomenclature. The Mijikenda Union, founded in 1944, advocates for collective coastal political identity. |

### Era 4: Independence & Modern Era (1963-present)

| Period | Title | Description |
|---|---|---|
| 1961-1963 | Independence | Tanganyika independent (1961), coastal strip ceded to Kenya (Oct 1963), Kenya independent (Dec 1963). The Mwambao movement for coastal autonomy fails; the Digo are divided between two nations. |
| 1983 | Kongo Mosque gazetted | The 13th-century mosque in Diani is declared a national monument by the National Museums of Kenya. |
| 1997 | Likoni clashes | Politically motivated violence in which Digo youth, recruited at Kaya Bombo, attack Likoni. ~100 killed, ~100,000 displaced. The Akiwumi Report finds KANU officials funded the militia. |
| 2008 | UNESCO World Heritage inscription | Eleven Mijikenda kaya forests, including Kaya Kinondo, inscribed as Sacred Mijikenda Kaya Forests. The following year, kaya traditions are placed on UNESCO's Urgent Safeguarding list. |
| 2014-present | Kwale titanium mining | Base Titanium begins exporting titanium from Kwale, displacing 3,000+ residents and destroying coconut and cashew groves. Decommissioning begins c. 2025 amid environmental protests. |

---

## 4. Digo Heroes & Notable Figures

Research findings for potential future articles or integration into timeline:

### Pre-colonial
- **Bandilo** -- Pre-colonial Wadigo leader in Tanga. Renowned healer-diviner, arrow expert, and community counsellor. Leaders of other groups sought his divination.
- **Abdallah Mwapodzo** -- Senior elder (mwanatsi) of Diani, said to be the first Muslim Digo in the Diani area.

### Why the record is thin
The Digo pursued **diplomatic accommodation** rather than armed resistance, making them less visible in colonial records. Other factors:
- **Matrilineal collective governance** (kambi councils) de-emphasised individual prominence
- **Early Islamization** shifted identity toward broader umma rather than ethnic heroes
- **Cross-border division** split documentation between Kenyan and Tanzanian sources
- **Absorption into "Mijikenda"** identity (coined 1940s) diluted Digo-specific narratives
- Colonial documentation bias toward groups that resisted (Giriama got a UC Press monograph; Digo did not)

### Modern figures
- **Chirau Ali Mwakwere** (b. 1945) -- Former Foreign Minister, current elected Digo community spokesman
- **Fatuma Mohamed Achani** -- Kenya's first female Muslim governor (Kwale, 2022)
- **Kassim Bakari Mwamzandi** (d. 2023) -- KANU MP, assistant minister under Kenyatta and Moi
- **Vincent Geoffrey Nkondokaya** (b. 1956) -- Tanzanian historian, author of key Wadigo origins text

---

## 5. Implementation Plan

### Files to create:
- `app/history/page.tsx` -- Server component, renders HistoryIndex
- `app/history/[topic]/page.tsx` -- Server component, renders article (reuse TopicArticle pattern)
- `components/HistoryIndex/HistoryIndex.tsx` -- Landing page with hero + timeline + article cards
- `components/HistoryIndex/HistoryIndex.module.css`
- `components/Timeline/Timeline.tsx` -- Reusable timeline component
- `components/Timeline/Timeline.module.css`

### Files to modify:
- `lib/culture/content.ts` -- Extract history domain data into a separate export; remove from culture domains array
- `components/Breadcrumb/Breadcrumb.tsx` -- Add `/history` breadcrumb handling
- `lib/i18n/config.ts` -- Add `history` section to Messages interface
- `lib/i18n/messages/en.json`, `sw.json`, `dig.json` -- Add history section strings
- `components/CultureIndex/CultureIndex.tsx` -- No changes needed (history domain simply won't appear since it's removed from the array)

### Data approach:
- Timeline events stored as a TypeScript constant in `lib/history/timeline.ts` (trilingual, same Record<Locale, string> pattern)
- History articles reuse the existing `Topic` and `ContentBlock` types from culture
- The history domain data moves from `domains[]` in content.ts to a separate `historyDomain` export

### Breadcrumb structure:
```
Chi-digo > History                          (landing)
Chi-digo > History > The Singwaya Migration (article)
```

### Static generation:
- `app/history/page.tsx` -- No params needed
- `app/history/[topic]/page.tsx` -- `generateStaticParams()` returns the 3 topic slugs

---

## 6. Design

### Timeline component:
- Left: year/period in `--font-sans`, small, `--color-kaya-indigo`
- Centre: vertical line (2px, `--color-coral-lime-sand`) with dot markers
- Right: title in `--font-display`, description in `--font-serif`
- Era headings span full width as section dividers
- Background: `--color-hando-cream`
- Mobile: year stacks above title, line hidden

### Hero:
- Same pattern as culture domain pages
- Background: `--color-kaya-deep`
- Proverb: "Mutu asiye na asili ni kama muhi usio na midzi" / "A person without origins is like a tree without roots"

### Article cards:
- Same `.cardGrid` / `.card` pattern as CultureIndex
- 3 cards: Singwaya Migration, Scholarly Debates, Kaya Archaeology
