export const DEFAULT_UPDATE_REPO = "VariantConst/OpenWebUI-Monitor";

export function isUpdateCheckDisabled() {
  return process.env.NEXT_PUBLIC_DISABLE_UPDATE_CHECK === "1";
}

export function getUpdateRepo() {
  const raw = (process.env.NEXT_PUBLIC_UPDATE_REPO || DEFAULT_UPDATE_REPO).trim();
  return raw
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "");
}

export function getUpdateUrls(repo = getUpdateRepo()) {
  return {
    repo,
    apiLatestRelease: `https://api.github.com/repos/${repo}/releases/latest`,
    apiLatestTag: `https://api.github.com/repos/${repo}/tags?per_page=1`,
    pageReleasesLatest: `https://github.com/${repo}/releases/latest`,
    pageTags: `https://github.com/${repo}/tags`,
    pageRepo: `https://github.com/${repo}`,
  };
}

export async function fetchLatestVersionTag(repo = getUpdateRepo()) {
  const urls = getUpdateUrls(repo);

  const releaseRes = await fetch(urls.apiLatestRelease);
  if (releaseRes.ok) {
    const data = await releaseRes.json();
    const tag = (data?.tag_name as string | undefined) || null;
    if (tag) return { tag, source: "release" as const, urls };
  }

  const tagsRes = await fetch(urls.apiLatestTag);
  if (tagsRes.ok) {
    const tags = (await tagsRes.json()) as Array<{ name?: string }>;
    const tag = tags?.[0]?.name || null;
    if (tag) return { tag, source: "tag" as const, urls };
  }

  return { tag: null as const, source: null as const, urls };
}

