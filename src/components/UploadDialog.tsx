"use client";

import { useEffect, useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { prepareImage, saveUserPage, type UserPage } from "@/lib/pages";
import { Sheet } from "./Sheet";

export function UploadDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (p: UserPage) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (open) return;
    setFile(null);
    setTitle("");
    setError(null);
    setResetKey((k) => k + 1);
  }, [open]);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const image = await prepareImage(file);
      const page: UserPage = { id: crypto.randomUUID(), title: title.trim() || "Neue Seite", image, createdAt: Date.now() };
      await saveUserPage(page);
      onAdded(page);
    } catch {
      setError("Das Foto ließ sich nicht speichern. Versuch es mit einem JPG oder PNG.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Seite einkleben" className="max-w-2xl">
      <h2 className="font-display text-2xl font-extrabold">Seite einkleben</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Fotografiere deine Heftseite möglichst gerade von oben. Sie landet als neue Seite hinten im Heft.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-dashed border-[var(--line)]">
        <FileUpload
          key={resetKey}
          onChange={(files) => {
            const f = files.find((x) => x.type.startsWith("image/"));
            if (f) {
              setFile(f);
              if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 28));
            } else if (files.length) setError("Bitte wähle ein Bild aus (JPG, PNG oder HEIC als JPG exportiert).");
          }}
        />
      </div>
      <label htmlFor="page-title" className="mt-4 block font-mono text-[11px] tracking-wider text-[var(--ink-soft)] uppercase">
        Titel der Seite
      </label>
      <input
        id="page-title"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 28))}
        placeholder="z. B. Blumen"
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--desk-2)] px-3 py-2 outline-none focus:border-[var(--violet)]"
      />
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-[var(--line)] bg-[var(--desk-2)] px-4 py-2 text-sm">
          Abbrechen
        </button>
        <button
          onClick={submit}
          disabled={!file || busy}
          className="rounded-xl bg-[var(--violet)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Wird eingeklebt …" : "Einkleben"}
        </button>
      </div>
    </Sheet>
  );
}
