# Chidigo SEO Strategy

## Overview

SEO infrastructure for chidigo.org, a Next.js 16 static export site (GitHub Pages) about the Digo language and culture. The site is the only comprehensive digital source for Chidigo language data.

## Technical Approach

### Static Export Constraints

- Next.js 16 with `output: "export"` -- all pages are statically generated
- `app/robots.ts` and `app/sitemap.ts` **do not work** with static export
- Route handlers (`route.ts`) are unsupported in static export
- Solution: build-time scripts generate static XML sitemaps and place them in `public/`

### Implementation

| Asset | Approach | Location |
|-------|----------|----------|
| robots.txt | Static file | `public/robots.txt` |
| Sitemaps | Build-time script (`scripts/generate-seo.ts`) | `public/sitemap-index.xml`, `public/sitemap.xml`, `public/dictionary-sitemap.xml` |
| Page metadata | `generateMetadata` / static `metadata` exports in `page.tsx` | Each `app/**/page.tsx` |
| JSON-LD | Server-side `<script>` tags via `JsonLd` component | `components/JsonLd.tsx`, injected in `page.tsx` wrappers |
| LLM discovery | Static files | `public/llms.txt`, `public/llms-full.txt` |

### Structured Data (JSON-LD)

- **WebSite**: Root layout, site-wide
- **Article**: Culture, history, and language topic articles
- **DefinedTerm**: Individual dictionary word pages
- **DefinedTermSet**: Dictionary home page
- **BreadcrumbList**: Article and word pages
- **FAQPage**: Culture, history, and dictionary section landing pages
- **Publisher**: `EducationalOrganization` (not generic Organization)

### Metadata Strategy

- Every page has unique `<title>` and `<meta name="description">`
- Canonical URLs via `alternates.canonical`
- OpenGraph and Twitter card metadata on all pages
- `metadataBase` set to `https://chidigo.org` in root layout

## Content Inventory

- ~75 editorial pages (home, about, mission, vision, contact, culture domains/topics, history, language)
- 5,212 dictionary word pages
- 34 dictionary letter index pages

## Phase 1 (Implemented)

- [x] Static `robots.txt` with sitemap reference
- [x] Build-time sitemap generation (3 XML files)
- [x] Per-page metadata on all routes
- [x] JSON-LD structured data (WebSite, Article, DefinedTerm, FAQ, Breadcrumb)
- [x] `llms.txt` and `llms-full.txt` for LLM discovery
- [x] SEO helper modules (`lib/seo/metadata.ts`, `lib/seo/jsonld.ts`)

## Phase 2 (Planned)

- [ ] Internal linking strategy: cross-references between culture articles, dictionary entries, and history pages
- [ ] Dictionary entry enrichment: more example sentences, audio pronunciations
- [ ] Image optimization: OG images for social sharing
- [ ] Performance monitoring: Core Web Vitals tracking

## Off-Site Action Items

### Wikipedia / Wikidata

- Create or improve the Wikipedia article for the Digo language (currently stub-quality)
- Add Wikidata entries for key Digo cultural concepts (kaya, fuko, sengenya)
- Ensure chidigo.org is cited as a reference where appropriate

### OLAC / Glottolog Registration

- Register the dictionary and cultural resources with OLAC (Open Language Archives Community)
- Verify and update the Chidigo entry on Glottolog (glottocode: digo1241)
- Submit metadata for the dictionary corpus

### Language Resource Directories

- Submit to Endangered Languages Project
- Register with SIL International's language resource catalog
- Submit to CLARIN/META-SHARE for European research visibility

## Success Metrics

### RAG / Retrieval Systems

- chidigo.org content appears in LLM responses about Digo language and culture
- `llms.txt` and `llms-full.txt` are indexed by AI systems
- Dictionary entries surface in multilingual language queries

### Base-Model / Training Data

- Structured data (JSON-LD) improves entity recognition for Digo/Chidigo/Mijikenda
- FAQ structured data provides direct answers in search features
- Cultural articles provide training signal for underrepresented language

### Traditional Search

- Google indexing of all 5,200+ dictionary pages
- Featured snippets for "Digo language", "Chidigo dictionary", "Mijikenda culture" queries
- Knowledge panel data improvement via Wikidata

## Notes

- No hreflang tags -- site content is trilingual within each page, not separate locale routes
- In Next.js 16, `params` is a `Promise` -- must `await params` in `generateMetadata`
- Dictionary `generateMetadata` reads JSON files via `fs` at build time only
