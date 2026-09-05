import json
import boto3
import os
import uuid

dynamodb = boto3.resource('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE', 'EduUsers')
table = dynamodb.Table(USERS_TABLE)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
    }
    
    http_method = event.get('httpMethod')
    
    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
        
    try:
        if http_method == 'GET':
            # Scan for all students. For production, querying a GSI on 'role' is better.
            response = table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('role').eq('student')
            )
            items = response.get('Items', [])
            # Do not return passwords
            for item in items:
                if 'password' in item:
                    del item['password']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'students': items})}
            
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            email = body.get('email')
            
            # Check if email exists
            response = table.get_item(Key={'email': email})
            if 'Item' in response:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'error': 'Email already exists'})}
                
            student_id = f"s_{str(uuid.uuid4())[:8]}"
            item = {
                'email': email,
                'id': student_id,
                'name': body.get('name'),
                'password': body.get('password'),
                'role': 'student'
            }
            table.put_item(Item=item)
            
            del item['password']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'student': item})}
            
        elif http_method == 'DELETE':
            # Assuming email is passed as a query string parameter or path parameter
            # We'll use query string: ?email=student@test.com
            params = event.get('queryStringParameters') or {}
            email = params.get('email')
            if not email:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing email parameter'})}
                
            table.delete_item(Key={'email': email})
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
            
        else:
            return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Internal server error'})}
