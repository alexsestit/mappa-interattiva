from bottle import route, static_file, run

@route('/')
def index():
    return static_file('index.html', root='.')

@route('/<filename:path>')
def serve_static(filename):
    return static_file(filename, root='.')

run(host='localhost', port=8080)