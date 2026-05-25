/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  function html2pdf(): {
    set: (options: Record<string, unknown>) => {
      from: (element: HTMLElement) => {
        save: () => Promise<void>;
        outputPdf: (type: string) => Promise<Blob>;
      };
    };
  };
  export default html2pdf;
}