// Matches an entire HTML tag OR a bare @username token. Tag alternative is checked first so
// replacement never touches text inside tags/attributes (e.g. alt="@bob" is left untouched).
const TAG_OR_MENTION = /(<[^>]+>)|@([A-Za-z0-9_]{3,50})/g;

/**
 * Converts @username tokens found in plain text runs of an HTML string into profile links.
 * Safe to run on already-sanitized HTML since it never modifies content inside tags.
 */
export function linkifyMentions(html: string): string {
  if (!html) return html;
  return html.replace(TAG_OR_MENTION, (match, tag, username) => {
    if (tag) return tag;
    return `<a class="mention-link" href="/profile/${username}">@${username}</a>`;
  });
}
