// hack to get around Word for Web iframe not specifying allow="clipboard-write" -CL
// https://github.com/OfficeDev/office-js/issues/1991
function fallbackCopyToClipboard(text: string) {
  const input = document.createElement('textarea');
  document.body.appendChild(input);
  input.value = text;
  input.focus();
  input.select();
  document.execCommand('Copy');
  input.remove();
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    fallbackCopyToClipboard(text);
  }
}
