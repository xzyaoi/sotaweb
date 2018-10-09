
import json
from flask import Flask
from flask import request
import arxiv
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def query():
    keyword = request.args.get('keyword')
    max_results = request.args.get('max')
    start = request.args.get('start')
    results = arxiv.query(search_query=keyword, start=start, max_results=max_results)
    return json.dumps(results)

if __name__ == '__main__':
    app.run(port=5000)