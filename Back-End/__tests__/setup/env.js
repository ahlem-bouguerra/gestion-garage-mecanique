process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.PORT = '5001';
process.env.BYPASS_AUTH = 'true';
process.env.MONGO_URI_TEST = 'mongodb://127.0.0.1:27017/garage_app_test'; 