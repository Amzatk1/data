from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/notifications', methods=['GET'])
def get_notifications():
    return jsonify({"message": "Notification service active"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)
