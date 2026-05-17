from flask import Flask
from flask_cors import CORS

from models import init_db
from routes.guests import guests_bp
from routes.messages import messages_bp
from routes.stats import stats_bp


def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    init_db()

    app.register_blueprint(guests_bp, url_prefix="/api/guests")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5001)
