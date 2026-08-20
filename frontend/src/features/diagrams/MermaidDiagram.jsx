import { useEffect, useId, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import mermaid from 'mermaid';
import { AlertTriangle, Download, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { selectTheme } from '@/features/ui/uiSlice';

/**
 * Renders Mermaid source into an inline SVG, entirely in the browser.
 *
 * This is the whole point of the diagrams feature being cheap to run and
 * deploy: the AI only ever produces TEXT (Mermaid DSL), and turning that
 * text into a picture costs nothing server-side — no headless Chromium, no
 * Cloudinary upload, no render queue. `mermaid.render()` does the same job
 * a paid image-generation API would, for free, on the client.
 */
const MermaidDiagram = ({ source, filename = 'diagram' }) => {
  const theme = useSelector(selectTheme);
  const containerRef = useRef(null);
  const renderId = useId().replace(/:/g, '');
  const [error, setError] = useState(null);
  const [svgMarkup, setSvgMarkup] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setError(null);
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'default',
          fontFamily: 'inherit',
        });
        const { svg } = await mermaid.render(`mermaid-${renderId}`, source);
        if (!cancelled) setSvgMarkup(svg);
      } catch (err) {
        if (!cancelled) {
          setSvgMarkup(null);
          setError(err?.message ?? 'This diagram source is not valid Mermaid syntax.');
        }
      }
    };

    if (source?.trim()) render();
    return () => {
      cancelled = true;
      // Mermaid leaves a detached error-render <div id="dmermaid-..."> in the
      // body on parse failure; nothing else references it, so it just leaks
      // across regenerations if left behind.
      document.getElementById(`dmermaid-${renderId}`)?.remove();
    };
  }, [source, theme, renderId]);

  const getSvgElement = () => containerRef.current?.querySelector('svg') ?? null;

  const downloadSvg = () => {
    const svgEl = getSvgElement();
    if (!svgEl) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], {
      type: 'image/svg+xml',
    });
    triggerDownload(URL.createObjectURL(blob), `${filename}.svg`);
  };

  const downloadPng = () => {
    const svgEl = getSvgElement();
    if (!svgEl) return;

    const { width, height } = svgEl.getBoundingClientRect();
    const scale = 2; // crisp on retina without the file becoming huge
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const ctx = canvas.getContext('2d');
      // Mermaid's SVG has a transparent background; a white backing keeps
      // the exported PNG readable when pasted into a report or slide.
      ctx.fillStyle = theme === 'dark' ? '#0b1020' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => triggerDownload(URL.createObjectURL(blob), `${filename}.png`));
    };
    img.src = svgUrl;
  };

  const triggerDownload = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-8 text-center">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm font-medium text-content-primary">Couldn&apos;t render this diagram</p>
        <p className="max-w-md text-xs text-content-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="overflow-auto rounded-xl border border-subtle bg-elevated/40 p-6 [&_svg]:mx-auto"
        // eslint-disable-next-line react/no-danger -- mermaid's own SVG output; securityLevel 'strict' sanitises it
        dangerouslySetInnerHTML={{ __html: svgMarkup ?? '' }}
      />
      {svgMarkup && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSvg} leftIcon={<Download className="h-3.5 w-3.5" />}>
            Download SVG
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPng} leftIcon={<ImageIcon className="h-3.5 w-3.5" />}>
            Download PNG
          </Button>
        </div>
      )}
    </div>
  );
};

export default MermaidDiagram;
