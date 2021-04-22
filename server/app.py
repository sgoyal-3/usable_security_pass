from flask import current_app, g, Flask, flash, jsonify, redirect, render_template, request, session, Response
from flask_cors import CORS, cross_origin
import logging
import json
import requests
import datetime
from db import DB, KeyNotFound, BadRequest

app = Flask(__name__)
app.config['SECRET_KEY'] = 'this is a secret key'
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, resources={r"/api/register" : {"origins" : "chrome-extension://bebffpohmffmkmbmanhdpepoineaegai"}})
db = DB()

# Hello world route to test connection
@app.route("/")
def index():
    return "Hello World!"


# user registration
@app.route("/api/register", methods=["POST"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def register_user():
    """
    Adds a new user to the database
    """
    post_body = request.json
    if not post_body: 
        return Response(response="No post body", status=400)
    try:
        db.add_user(post_body)
    except BadRequest as e:
        return Response(response=e.message, status=400)

    return Response(status=201)


# user login
@app.route("/api/login", methods=["GET"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def login_user():
    """
    Checks is a user's provided credentials are correct
    """
    email = request.args.get('email')
    if not email:
        logging.error(" Missing required URL parameters")
        return Response(response=" Missing required URL parameters", status=400)
    try:
        return jsonify({"password" : db.fetch_user_password(email)}) 
    except BadRequest as e:
        logging.error("email not present in body")
        return Response(response=e.message, status=400)
    except KeyNotFound as e:
        logging.error("email not found in database")
        return Response(response=e.message, status=400)
    return Response(status=400)



    





