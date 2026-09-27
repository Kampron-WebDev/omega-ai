/**
 * The first letter or digit of each of the first two words of a name,
 * uppercased — `null` when the name has none (empty, or only punctuation), so
 * each caller picks its own fallback.
 */
function initialsFromName(name: string): string | null {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}|\p{N}/u)?.[0] ?? "")
    .filter((letter) => letter !== "")
    .slice(0, 2)
    .join("")

  return letters === "" ? null : letters.toUpperCase()
}

export { initialsFromName }
