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
def login_user():
    """
    Checks is a user's provided credentials are correct
    """
    body = request.json
    if not body:
        return Response(response="No body", status=400)
    try:
        return jsonify({"validated" : db.verify_user_credentials(body)}) 
    except BadRequest as e:
        return Response(response=e.message, status=400)
    except KeyNotFound as e:
        return Response(response=e.message, status=400)
    return Response(status=400)



    





