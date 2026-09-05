import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE', 'EduUsers')
table = dynamodb.Table(USERS_TABLE)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }
    
    # Handle CORS Preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password')

        if not email or not password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email and password required'})}

        # Hardcoded Admin Check
        if email == 'admin@system.com' and password == 'admin':
            return {
                'statusCode': 200, 
                'headers': headers, 
                'body': json.dumps({
                    'success': True,
                    'user': {'role': 'admin', 'name': 'System Admin', 'email': email, 'id': 'admin_01'}
                })
            }

        # Check DynamoDB for Student
        response = table.get_item(Key={'email': email})
        user = response.get('Item')

        if user and user.get('password') == password:
            # DO NOT return the password in the response
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'role': user.get('role', 'student'),
                        'name': user.get('name'),
                        'email': user.get('email'),
                        'id': user.get('id')
                    }
                })
            }
        else:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'success': False, 'error': 'Invalid email or password'})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Internal server error'})}
