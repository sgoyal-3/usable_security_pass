from flask import current_app, g, Flask, flash, jsonify, redirect, render_template, request, session, Response
from flask_cors import CORS, cross_origin
import logging
import json
import requests
import datetime
from log import errors as err
from db import DB, KeyNotFound, BadRequest
import pymongo
import urllib
from pprint import pprint

# App config
app = Flask(__name__)
app.config['SECRET_KEY'] = 'this is a secret key'
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, resources={r"/api/register" : {"origins" : "chrome-extension://bebffpohmffmkmbmanhdpepoineaegai"}})

# Databse config
'''
mongo_uri = "mongodb+srv://user-2:550Maranello@learning-cluster.tpidq.mongodb.net/?retryWrites=true&w=majority"
client = pymongo.MongoClient(mongo_uri)
db = client.mashypass
'''

db = DB()

# Hello world route to test connection
@app.route("/")
def index():
    return "Hello from a Heroku server!"

# Create an example user
@app.route("/create", methods=["POST"])
def create_example_user():
    sample_user = {
        "email" : "name@example.com",
        "password" : "password",
        "registered" : True,
        "logged_in" : True,
        "session_id" : "123456790",
        "session_id_expires" : datetime.datetime.now() + datetime.timedelta(minutes = 30),
        "vault" : [
            {
                "url" : "www.example.com",
                "username" : "username",
                "password" : "password"
            }
        ]
    }
    db.users.insert_one(sample_user)
    return Response(status=201)


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
    session_id = request.args.get('session-id')
    request_body = request.json
    if not email or not session_id:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    if not request_body:
        logging.error(err.MISSING_REQUEST_BODY)
        return Response(status=400)
    try:
        db.add_vault_entry(email, session_id, request_body)
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
    session_id = request.args.get('session-id')
    if not email or not url or not session_id:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    try:
        return jsonify(db.fetch_vault_entry(email, url, session_id))
    except BadRequest as e:
        return Response(response=e.message, status=400)
    except KeyNotFound as e:
        return Response(response=e.message, status=400)
    return Response(status=400)


# Update an existing record in user's vault
@app.route("/api/vault", methods=["PUT"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def update_vault_entry():
    '''
    Update an existing record in user's vault
    '''
    email = request.args.get('email')
    session_id = request.args.get('session-id')
    request_body = request.json

    if not email or not session_id:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    if not request_body:
        logging.error(err.MISSING_REQUEST_BODY)
        return Response(status=400)
    
    try:
        db.update_vault_entry(email, session_id, request_body)
        return Response(status=201)
    except BadRequest as e:
        return Response(status=400, response=e.message)
    except KeyNotFound as e:
        return Response(status=400, response=e.message)
    return Response(status=400)


# Delete a record from the vault
@app.route("/api/vault", methods=["DELETE"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def delete_vault_entry():
    '''
    Delete a vault entry from a user's vault
    '''
    email = request.args.get('email')
    url = request.args.get('url')
    session_id = request.args.get('session-id')
    if not email or not url or not session_id:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    try:
        db.delete_vault_entry(email, url, session_id)
        return Response(status=201)
    except BadRequest as e:
        return Response(status=400, respose=e.message)
    except KeyNotFound as e:
        return Response(status=400, response=e.message)
    
    return Response(status=400)


# Check if user is reusing passwords accross multiple websites
@app.route("/api/analytics/vault/reuse", methods=["GET"])
@cross_origin(origin='chrome-extension://bebffpohmffmkmbmanhdpepoineaegai', headers=['Content- Type','Authorization'])
def get_resuse_statistics():
    '''
    Find the number of passwords a user is reusing across all accounts
    '''
    email = request.args.get('email')
    session_id = request.args.get('session-id')
    if not email or not session_id:
        logging.error(err.MISSING_URL_PARAMS)
        return Response(status=400)
    try:
        return jsonify(db.get_resuse_statistics(email, session_id))
    except BadRequest as e:
        return Response(status=400, response=e.message)
    except KeyNotFound as e:
        return Response(status=400, response=e.message)
        
    return Response(status=400)









    





