from flask import current_app, g, Flask, flash, jsonify, redirect, render_template, request, session, Response
from flask_cors import CORS, cross_origin
import logging
import json
import requests
import datetime
from log import errors as err
from db import DB, KeyNotFound, BadRequest

# App config
app = Flask(__name__)
app.config['SECRET_KEY'] = 'this is a secret key'
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, resources={r"/api/register" : {"origins" : "chrome-extension://bebffpohmffmkmbmanhdpepoineaegai"}})
db = DB()

# Hello world route to test connection
@app.route("/")
def index():
    return "Hello from a Heroku server!"


# user registration
@app.route("/api/register", methods=["POST"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def register_user():
    """
    Adds a new user to the database
    """
    post_body = request.json
    if not post_body: 
        return Response(response=err.MISSING_REQUEST_BODY, status=400)
    try:
        db.add_user(post_body)
    except BadRequest as e:
        return Response(response=e.message, status=400)

    return Response(status=201)


# Route to get user's password
@app.route("/api/login", methods=["GET"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def fetch_user_password():
    """
    Return user's password based on their email
    """
    email = request.args.get('email')
    if not email:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(response=err.MISSING_URL_PARAMS, status=400)
    try:
        password = db.fetch_user_password(email)
        response = Response(status=201, response=password)
        return response
    except BadRequest as e:
        logging.error(err.MISSING_REQUEST_PARAM)
        return Response(response=err.MISSING_REQUEST_PARAM, status=400)
    except KeyNotFound as e:

        logging.error(err.EMAIL_NOT_FOUND)
        return Response(response=err.EMAIL_NOT_FOUND, status=400)
    return Response(status=400)


# Route that logs in user on server end
@app.route("/api/login", methods=["PUT"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def login_user():
    """
    Login the user based on email
    """
    email = request.args.get('email')
    token = request.args.get('token')
    if not email or not token:
        logging.error(err.MISSING_URL_PARAMS)
    try:
        session_id = db.login_user(email, token)
        return Response(response=session_id, status=201)
    except KeyNotFound as e:
        logging.error(err.EMAIL_NOT_FOUND)
        return Response(response=e.message, status=400)
    except BadRequest as e:
        logging.error(e.message)
        return Response(response=e.message, status=400)
    
    return Response(status=400)


# add a new record to vault
@app.route("/api/vault", methods=["POST"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def add_vault_entry():
    """
    Add a new vault entry to user's list of vault entries
    """
    email = request.args.get('email')
    request_body = request.json
    if not email:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    if not request_body:
        logging.error(err.MISSING_REQUEST_BODY)
        return Response(status=400)
    try:
        db.add_vault_entry(email, request_body)
        return Response(status=201)
    except BadRequest as e:
        return Response(response=e.message, status=400)
    return Response(status=400)


# Retrieve a recrod from the vault
@app.route("/api/vault", methods=["GET"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def fetch_vault_entry():
    """
    Fetch a vault entry from the user's vault
    """
    email = request.args.get('email')
    url = request.args.get('url')
    if not email or not url:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    try:
        return jsonify(db.fetch_vault_entry(email, url))
    except BadRequest as e:
        return Response(response=e.message, status=400)
    except KeyNotFound as e:
        return Response(response=e.message, status=400)
    return Response(status=400)





    





