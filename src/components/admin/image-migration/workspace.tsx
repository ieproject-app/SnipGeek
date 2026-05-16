"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  fetchImageMigrationInventory,
  type ArticleGroupCandidate,
  type ImageCandidate,
} from "@/components/admin/admin-api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CLOUDINARY_PREFIX = "https://res.cloudinary.com/snipgeek/";

type MappingIssue = {
  imagePath: string;
  message: string;
};

function normalizeOldPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("public/images/")) {
    return `/${trimmed.slice("public/".length)}`;
  }
  return trimmed;
}

function dateLabel(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function articleSearchText(group: ArticleGroupCandidate): string {
  const localeText = group.localeEntries
    .map((entry) => `${entry.locale} ${entry.slug} ${entry.filePath} ${entry.title}`)
    .join(" ");
  return `${group.title} ${group.translationKey} ${localeText}`.toLowerCase();
}

function getPreferredIdTitle(group: ArticleGroupCandidate): string {
  const idEntry = group.localeEntries.find((entry) => entry.locale.toLowerCase() === "id");
  return idEntry?.title?.trim() || group.title;
}

export function ImageMigrationWorkspace() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [articleGroups, setArticleGroups] = useState<ArticleGroupCandidate[]>([]);
  const [summary, setSummary] = useState({
    totalUnmigratedImages: 0,
    totalUnmigratedArticles: 0,
    totalUnmigratedArticleGroups: 0,
    totalProjectLevelImages: 0,
  });
  const [generatedAt, setGeneratedAt] = useState("");

  const [articleQuery, setArticleQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});

  const candidateMap = useMemo(() => {
    const map = new Map<string, ImageCandidate>();
    for (const item of candidates) map.set(item.imagePath, item);
    return map;
  }, [candidates]);

  const filteredArticleGroups = useMemo(() => {
    const query = articleQuery.trim().toLowerCase();
    if (!query) return articleGroups;
    return articleGroups.filter((group) => articleSearchText(group).includes(query));
  }, [articleQuery, articleGroups]);

  const selectedGroup = useMemo(() => {
    return articleGroups.find((group) => group.id === selectedGroupId) ?? null;
  }, [articleGroups, selectedGroupId]);

  const articleImageRows = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.imagePaths.map((imagePath) => ({
      imagePath,
      candidate: candidateMap.get(imagePath) ?? null,
      newUrl: urlMap[imagePath] ?? "",
    }));
  }, [selectedGroup, candidateMap, urlMap]);

  const mappingIssues = useMemo(() => {
    const issues: MappingIssue[] = [];
    for (const row of articleImageRows) {
      const oldPath = normalizeOldPath(row.imagePath);
      const newUrl = row.newUrl.trim();

      if (!oldPath.startsWith("/images/")) {
        issues.push({
          imagePath: row.imagePath,
          message: `${row.imagePath}: path lama tidak valid (harus /images/...).`,
        });
      }
      if (!candidateMap.has(oldPath)) {
        issues.push({
          imagePath: row.imagePath,
          message: `${row.imagePath}: path tidak ditemukan pada inventory.`,
        });
      }
      if (!newUrl) {
        issues.push({
          imagePath: row.imagePath,
          message: `${row.imagePath}: URL Cloudinary masih kosong.`,
        });
      } else if (!newUrl.startsWith(CLOUDINARY_PREFIX)) {
        issues.push({
          imagePath: row.imagePath,
          message: `${row.imagePath}: URL wajib dimulai ${CLOUDINARY_PREFIX}`,
        });
      }
    }
    return issues;
  }, [articleImageRows, candidateMap]);

  const validMappings = useMemo(() => {
    const invalidPaths = new Set(mappingIssues.map((issue) => issue.imagePath));
    return articleImageRows
      .filter((row) => !invalidPaths.has(row.imagePath))
      .map((row) => ({
        oldPath: normalizeOldPath(row.imagePath),
        newUrl: row.newUrl.trim(),
      }));
  }, [articleImageRows, mappingIssues]);

  const affectedFiles = useMemo(() => {
    const set = new Set<string>();
    for (const mapping of validMappings) {
      const candidate = candidateMap.get(mapping.oldPath);
      if (!candidate) continue;
      for (const usage of candidate.usages) set.add(usage.filePath);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [candidateMap, validMappings]);

  const cleanupCandidates = useMemo(() => {
    return validMappings
      .map((mapping) => candidateMap.get(mapping.oldPath))
      .filter((item): item is ImageCandidate => Boolean(item?.existsInPublic))
      .map((item) => item.publicFilePath)
      .sort((a, b) => a.localeCompare(b));
  }, [candidateMap, validMappings]);

  const generatedPrompt = useMemo(() => {
    if (!selectedGroup || validMappings.length === 0) return "";

    const mappingLines = validMappings
      .map((mapping) => `- ${mapping.oldPath} -> ${mapping.newUrl}`)
      .join("\n");
    const fileLines = affectedFiles.length
      ? affectedFiles.map((filePath) => `- ${filePath}`).join("\n")
      : "- (tidak ada)";
    const cleanupLines = cleanupCandidates.length
      ? cleanupCandidates.map((filePath) => `- ${filePath}`).join("\n")
      : "- (tidak ada file lokal yang perlu dihapus)";

    return [
      `Tolong jalankan migrasi gambar 1:1 untuk artikel berikut:`,
      `- translationKey: ${selectedGroup.translationKey}`,
      `- type: ${selectedGroup.type}`,
      `- anchor title (ID): ${getPreferredIdTitle(selectedGroup)}`,
      `- locales in scope: ${selectedGroup.localeEntries.map((entry) => entry.locale).join(", ")}`,
      "- source files:",
      ...selectedGroup.localeEntries.map(
        (entry) => `  - [${entry.locale}] ${entry.filePath} (slug: ${entry.slug})`,
      ),
      "",
      "Scope mapping:",
      mappingLines,
      "",
      "File konten/config terdampak (wajib diprioritaskan):",
      fileLines,
      "",
      "Target cleanup file lokal (hapus hanya jika referensi sudah bersih):",
      cleanupLines,
      "",
      "Aturan wajib:",
      "- Jangan ubah frontmatter date atau updated.",
      "- Jangan ubah konten di luar path mapping di atas.",
      "- Gambar level proyek (bukan artikel) boleh tetap di folder proyek, skip jika tidak relevan ke artikel ini.",
      "- Setelah replace, scan ulang old path agar nol referensi.",
      "- Jalankan npm run check untuk validasi akhir.",
      "",
      "Checklist verifikasi:",
      "- rg -n \"<old-path-1>|<old-path-2>|...\" _posts _notes src",
      "- npm run check",
      "- Laporkan file yang berubah, file yang dihapus, dan hasil check.",
    ].join("\n");
  }, [selectedGroup, validMappings, affectedFiles, cleanupCandidates]);

  const blockingIssues = !selectedGroup || mappingIssues.length > 0 || validMappings.length === 0;

  const fetchInventory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchImageMigrationInventory();
      setCandidates(data.candidates);
      setArticleGroups(data.articleGroups);
      setSummary(data.summary);
      setGeneratedAt(data.generatedAt);
      setSelectedGroupId((prev) =>
        prev && data.articleGroups.some((group) => group.id === prev)
          ? prev
          : data.articleGroups[0]?.id ?? "",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat inventory.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    setUrlMap((prev) => {
      const next: Record<string, string> = {};
      for (const imagePath of selectedGroup.imagePaths) {
        next[imagePath] = prev[imagePath] ?? "";
      }
      return next;
    });
  }, [selectedGroup]);

  const updateUrl = (imagePath: string, newUrl: string) => {
    setUrlMap((prev) => ({ ...prev, [imagePath]: newUrl }));
  };

  const fillTemplateForSelected = () => {
    if (!selectedGroup) return;
    setUrlMap((prev) => {
      const next = { ...prev };
      for (const imagePath of selectedGroup.imagePaths) {
        if (!next[imagePath]) next[imagePath] = "";
      }
      return next;
    });
  };

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button className="mt-4" variant="outline" onClick={() => fetchInventory()}>
          <RefreshCw className="h-4 w-4" />
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-4 py-5 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1540px] items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Media · Image Migration
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.03em]">
              Migration Per Artikel
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Generated {new Date(generatedAt).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchInventory(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1540px] px-4 py-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="border border-border bg-card px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Unmigrated Images
            </p>
            <p className="mt-1 text-2xl font-bold">{summary.totalUnmigratedImages}</p>
          </div>
          <div className="border border-border bg-card px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Unmigrated Articles
            </p>
            <p className="mt-1 text-2xl font-bold">{summary.totalUnmigratedArticles}</p>
          </div>
          <div className="border border-border bg-card px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Bilingual Targets
            </p>
            <p className="mt-1 text-2xl font-bold">{summary.totalUnmigratedArticleGroups}</p>
          </div>
          <div className="border border-border bg-card px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Project-level Images
            </p>
            <p className="mt-1 text-2xl font-bold">{summary.totalProjectLevelImages}</p>
            <p className="text-xs text-muted-foreground">
              Non-artikel, boleh tetap di folder proyek jika tidak perlu dimigrasi.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1540px] grid-cols-1 gap-5 px-4 pb-24 md:px-6 lg:px-8 xl:grid-cols-[minmax(380px,460px)_minmax(0,1fr)]">
        <section className="border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              Article rail
            </p>
            <h2 className="mt-1 text-base font-bold tracking-tight">
              Target artikel bilingual (urut: terlama lalu gambar paling sedikit)
            </h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={articleQuery}
                onChange={(event) => setArticleQuery(event.target.value)}
                className="pl-9"
                placeholder="Cari judul, slug, atau path..."
              />
            </div>
            <div className="max-h-[520px] space-y-2 overflow-y-auto border border-border p-2">
              {filteredArticleGroups.map((group) => {
                const active = group.id === selectedGroupId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={cn(
                      "w-full border px-3 py-2 text-left",
                      active ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <p className="truncate text-sm font-semibold">{getPreferredIdTitle(group)}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {group.translationKey} · {group.type} · {dateLabel(group.date)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {group.imageCount} gambar lokal · locale: {group.localeEntries.map((entry) => entry.locale).join(", ")}
                    </p>
                  </button>
                );
              })}
              {filteredArticleGroups.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada artikel cocok.</p>
              )}
            </div>
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              Mapping rail
            </p>
            <h2 className="mt-1 text-base font-bold tracking-tight">
              Mapping gambar per artikel + generated prompt
            </h2>
          </div>
          <div className="space-y-4 p-4">
            {selectedGroup ? (
              <div className="border border-border bg-background px-3 py-2 text-sm">
                <p className="font-semibold">{getPreferredIdTitle(selectedGroup)}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {selectedGroup.translationKey} · {dateLabel(selectedGroup.date)} · {selectedGroup.localeEntries.map((entry) => entry.locale).join(", ")}
                </p>
                {selectedGroup.localeEntries.map((entry) => (
                  <p key={`${selectedGroup.id}-${entry.locale}`} className="font-mono text-[11px] text-muted-foreground">
                    [{entry.locale}] {entry.filePath}
                  </p>
                ))}
              </div>
            ) : (
              <div className="border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                Pilih artikel dulu.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fillTemplateForSelected} disabled={!selectedGroup}>
                Siapkan input URL
              </Button>
            </div>

            <div className="max-h-[340px] overflow-auto border border-border">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-muted/60">
                  <tr>
                    <th className="border-b border-border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Path lama
                    </th>
                    <th className="border-b border-border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      URL Cloudinary baru
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articleImageRows.map((row) => (
                    <tr key={row.imagePath}>
                      <td className="border-b border-border px-3 py-2 align-top">
                        <p className="font-mono text-[11px]">{row.imagePath}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.candidate?.usageCount ?? 0} referensi
                        </p>
                      </td>
                      <td className="border-b border-border px-3 py-2 align-top">
                        <Input
                          value={row.newUrl}
                          onChange={(event) => updateUrl(row.imagePath, event.target.value)}
                          placeholder="https://res.cloudinary.com/snipgeek/image/upload/..."
                          className="h-9 font-mono text-[12px]"
                        />
                      </td>
                    </tr>
                  ))}
                  {articleImageRows.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Belum ada gambar untuk artikel ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 border px-3 py-2 text-sm",
                blockingIssues
                  ? "border-destructive/60 bg-destructive/5 text-destructive"
                  : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700",
              )}
            >
              {blockingIssues ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {blockingIssues
                ? `${mappingIssues.length} issue validasi terdeteksi.`
                : `Mapping valid (${validMappings.length} gambar).`}
            </div>

            {mappingIssues.length > 0 && (
              <div className="max-h-[160px] space-y-1 overflow-y-auto border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                {mappingIssues.map((issue) => (
                  <p key={`${issue.imagePath}-${issue.message}`}>{issue.message}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Files terdampak ({affectedFiles.length})
                </p>
                <div className="max-h-[180px] overflow-y-auto">
                  {affectedFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada.</p>
                  ) : (
                    affectedFiles.map((filePath) => (
                      <p key={filePath} className="font-mono text-[11px] leading-5">
                        {filePath}
                      </p>
                    ))
                  )}
                </div>
              </div>
              <div className="border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cleanup candidates ({cleanupCandidates.length})
                </p>
                <div className="max-h-[180px] overflow-y-auto">
                  {cleanupCandidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada.</p>
                  ) : (
                    cleanupCandidates.map((filePath) => (
                      <p key={filePath} className="font-mono text-[11px] leading-5">
                        {filePath}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Generated prompt
                </p>
                <Button size="sm" variant="outline" onClick={handleCopyPrompt} disabled={!generatedPrompt}>
                  <ClipboardCopy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Textarea
                readOnly
                value={generatedPrompt}
                className="min-h-[320px] font-mono text-[12px]"
                placeholder="Prompt akan muncul setelah mapping valid."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
