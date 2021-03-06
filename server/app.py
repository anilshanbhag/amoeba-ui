import os
from flask import Flask
from datetime import timedelta
from flask import make_response, request, current_app
from functools import update_wrapper
app = Flask(__name__)

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    """
    Enables crossdomain requests.
    """
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

@app.route('/', methods=['POST', 'OPTIONS'])
@crossdomain(origin='*')
def main():
    dataset = request.form.get('dataset')
    workload = request.form.get('workload')
    c = request.form.get('c')
    open("/Users/anil/queries.log", "w").write(workload)
    os.chdir("/Users/anil/Dev/repos/amoeba/scripts/")
    if dataset == "simple":
        os.system("fab setup:local_simple simulator_adapt_formatted:%s" % c)
        return open("/Users/anil/logs/sim_adapt.log").read()
    elif dataset == "simple2":
        os.system("fab setup:local_simple2 simulator_adapt_formatted:%s" % c)
        return open("/Users/anil/logs/sim_adapt.log").read()
    else:
        return 'Unknown Dataset!'

