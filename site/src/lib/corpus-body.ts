/** Notes and other export bodies may be plain text or WordPress-style HTML. */
export function corpusBodyIsHtml(content: string): boolean {
	return /^\s*</.test(content.trim());
}
