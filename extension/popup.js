$ = document.getElementById.bind(document);

var postingFormNode = $('posting-form');
var noteNode = $('note');
var shareCheckboxNode = $('share-checkbox');
var shareLinkNode = $('share-link');
var shareData;

postingFormNode.onsubmit = handleFormSubmit;

getShareData(function(loadedShareData) {
  shareData = loadedShareData;
  shareCheckboxNode.checked = true;
  shareLinkNode.href = shareData.url;
  if (shareData.title.length > 30) {
    shareLinkNode.innerText = shareData.title.substring(0, 30) + '…';
  } else {
    shareLinkNode.innerText = shareData.title;
  }
});

function handleFormSubmit(event) {
  event.preventDefault();

  var note = noteNode.value;

  if (shareCheckboxNode.checked) {
    note += '\n' + shareData.title + ' - ' + shareData.url;
  }

  getSignature(function(signature) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      alert('success: ' + xhr.responseText);
    };
    xhr.onerror = function() {
      alert('failure: ' + xhr.responseText);
    };

    xhr.open(
        'POST',
        'https://avocado.io/api/conversation?avosig=' + encodeURIComponent(signature),
        true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('message=' + encodeURIComponent(note));
  });
}

function getShareData(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    var tab = tabs[0];
    // During development, the popup is in its own tab, so we use the first
    // tab in the window instead.
    if (tab.url == location.href) {
      chrome.tabs.query({currentWindow: true}, function (tabs) {
        continueWithTab(tabs[0]);
      });
    } else {
      continueWithTab(tab);
    }
  });

  function continueWithTab(tab) {
    callback({url: tab.url, title: tab.title});
  }
}

var SIGNATURE_RE = /var\s+apiSignature\s+=\s+"(.+)";/m;

function getSignature(callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var match = SIGNATURE_RE.exec(xhr.responseText);
    if (!match) {
      alert('Couldn\'t find signature');
      return;
    }

    callback(match[1]);
  };
  xhr.onerror = function() {
    alert('xhr error');
  };
  xhr.open('GET', 'https://avocado.io/=/', true);
  xhr.send();
}