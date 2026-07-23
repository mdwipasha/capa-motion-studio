export async function chooseFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.item(0) ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export function downloadTextFile(fileName: string, content: string, mimeType = "application/json"): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function toRmaFileName(projectName: string): string {
  const safeName = projectName.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ");
  return `${safeName || "Untitled Motion"}.rma`;
}
