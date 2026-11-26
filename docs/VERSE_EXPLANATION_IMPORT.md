# Import verse explanations from a document

Run these commands from `backend/`. The importer accepts a public Google Docs link, a UTF-8 `.txt` export, or a `.pdf` with selectable text. PDF extraction requires `pdftohtml` (on Ubuntu/Debian, install `poppler-utils`). Scanned PDFs need OCR first. For a document with chapter tabs, copy the link while the intended tab is open so the URL includes `tab=`. For a private document, download a text or PDF export and use `--file`.

```bash
npm run import:verse-explanations -- --url '<Google Docs link>' --range 'Ecclesiastes 6:10-12'
npm --silent run import:verse-explanations -- --file ./chapter.txt --range 'Ecclesiastes 6:10-12' --json
npm run import:verse-explanations -- --file ~/Downloads/esther.pdf --range 'Esther 9:1-2'
```

These commands preview only and do not open a database connection. The default preview shows the complete extraction in labeled, wrapped sections; `--summary` shows counts only and `--json` emits the structured extraction. `--range` is optional; without it the importer processes all entries in the chosen document or tab. The `#heading=` part of a Google Docs link does not limit the text export; use `--range` to select verses. Each entry follows the existing editor template: **Section 1. Mention the Verse**, **Section 2. Explanation**, and **Section 3. Learn More**, including background, Strong’s studies, applications, themes, cross references, and takeaways. Verse and cross-reference headings accept either `Numbers 5:1 BSB` or `Numbers 5:1 (BSB)`. Their references are checked against the bundled BSB. The document quotation is shown for review only; the editor gets the main verse text from the selected Bible edition.

Strong’s headings may use `Name (H8034 – Shem)`, `Overturn - Nahaphakh - Strong's H2015`, `1. LORD — YHWH — Strong’s H3068`, or `Sad Countenance (Hebrew: רַע פָּנִים, Ra Panim, Strong's H7451 / H6440)`. List numbers are not saved as part of the word label. The importer keeps the transliteration in the word label, preserves the original spelling when supplied, and saves every ID in a compound heading. Definition subheadings such as “Contextual Meaning” are optional. When two entries for the same verse match apart from spacing, the importer keeps the first and warns. Conflicting copies are reported with the section line numbers in the extracted text rather than guessed or merged.

After reviewing the preview, add `--apply`. The default is `admin@gmail.com`, which must be an existing active admin in the target database. Override it with `--admin-email`. `DATABASE_URL` (from the shell or `backend/.env`) determines the database; a localhost web page does not establish that the database is local.

If a selected range has gaps, the default is to stop and report the first missing verse. Add `--skip-missing` to preview or import only the verses present in the source. This does not skip malformed explanations or allow invalid BSB references.

```bash
# Local PostgreSQL
npm run import:verse-explanations -- --file ./chapter.txt \
  --range 'Ecclesiastes 6:10-12' --apply --admin-email 'admin@example.com'

# Remote PostgreSQL (including Railway) uses the same command.
```

With `--apply`, the CLI displays the full preview and configured destination, then asks you to type `yes`. Any other answer cancels before connecting to the database. Railway works directly from `DATABASE_URL` without an extra flag. Unattended execution requires an explicit `--yes` in addition to `--apply`.

Apply uses the same save service as the admin editor. It creates only new explanations, skips existing matches, and verifies each created entry against the document. A failure stops the batch; previously verified entries stay saved and are skipped when resuming. Review any reported readback mismatch before resuming. The CLI does not edit existing explanations or publish anything during preview.
