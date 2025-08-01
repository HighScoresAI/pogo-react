# wsgi.py

# Import the application factory function from main.py
from main import create_app

# Call the application factory to create the Flask application instance.
# Gunicorn will use this 'app' variable as the entry point.
app = create_app()

# The __main__ block is not executed by Gunicorn,
# but is kept here for consistency if you ever run wsgi.py directly
if __name__ == "__main__":
    # When running wsgi.py directly (e.g., for development testing),
    # call the app.run() method.
    #app.run()
    app.run(host="0.0.0.0", port=5000, debug=True)
