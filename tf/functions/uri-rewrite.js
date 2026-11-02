const directories = DIRECTORIES;
const canonicalHost = CANONICAL_HOST;

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

function handler(event) {
  const request = event.request;
  if (request.headers.host.value.toLowerCase() === 'www.' + canonicalHost) {
    const query = [];
    Object.keys(request.querystring).forEach(function (name) {
      const parameter = request.querystring[name];
      (parameter.multiValue || [parameter]).forEach(function (value) {
        query.push(name + '=' + value.value);
      });
    });
    return redirect('https://' + canonicalHost + request.uri + (query.length ? '?' + query.join('&') : ''));
  }
  const uri = request.uri;
  if (uri.endsWith('.html') && uri !== '/404.html') {
    return redirect(uri.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''));
  }
  if (directories[uri] === true) {
    return redirect(uri + '/');
  }
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.slice(uri.lastIndexOf('/')).includes('.')) {
    request.uri = uri + '.html';
  }
  return request;
}
