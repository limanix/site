const errorPage = '/404.html';
const canonicalHost = CANONICAL_HOST;
const directories = DIRECTORIES;


function handler(event) {
  const request = event.request;
  const uri = request.uri;

  if (isWwwHost(request)) {
    return redirect('https://' + canonicalHost + uri + queryString(request));
  }
  if (uri.endsWith('.html') && uri !== errorPage) {
    return redirect(withoutHtml(uri));
  }
  if (directories[uri] === true) {
    return redirect(uri + '/');
  }

  request.uri = fileInBucket(uri);
  return request;
}

function isWwwHost(request) {
  return request.headers.host.value.toLowerCase() === 'www.' + canonicalHost;
}

function queryString(request) {
  const pairs = [];

  Object.keys(request.querystring).forEach(function (name) {
    const parameter = request.querystring[name];
    const values = parameter.multiValue || [parameter];

    values.forEach(function (item) {
      pairs.push(name + '=' + item.value);
    });
  });

  if (pairs.length === 0) {
    return '';
  }

  return '?' + pairs.join('&');
}

function withoutHtml(uri) {
  return uri.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
}

function fileInBucket(uri) {
  if (uri.endsWith('/')) {
    return uri + 'index.html';
  }

  const lastSegment = uri.slice(uri.lastIndexOf('/'));

  if (lastSegment.includes('.')) {
    return uri;
  }
  return uri + '.html';
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}
