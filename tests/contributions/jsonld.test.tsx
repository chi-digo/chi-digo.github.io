import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonLd } from '@/components/JsonLd';

describe('JsonLd (SEC-1)', () => {
  it('keeps hostile text inside the JSON-LD script', () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />);
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
});
