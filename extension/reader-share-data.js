// We can't see the getPermalink() function (since it's in the main world) but
// we can run it via a javascript: URL. We can get at its return value via an
// message listener (at least until http://crbug.com/87520 is fixed).

window.addEventListener('message', function readerMessageListener(message) {
  chrome.extension.sendMessage(message.data || {});
  window.removeEventListener('message', readerMessageListener);
});

window.location.href = 'javascript:postMessage(getPermalink(), location.href)';