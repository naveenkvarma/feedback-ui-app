import json
import boto3
import os
import uuid

dynamodb = boto3.resource('dynamodb')
TEACHERS_TABLE = os.environ.get('TEACHERS_TABLE', 'EduTeachers')
table = dynamodb.Table(TEACHERS_TABLE)

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
            response = table.scan()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'teachers': response.get('Items', [])})}
            
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            teacher_id = f"t_{str(uuid.uuid4())[:8]}"
            item = {
                'id': teacher_id,
                'name': body.get('name'),
                'subject': body.get('subject'),
                'department': body.get('department')
            }
            table.put_item(Item=item)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'teacher': item})}
            
        elif http_method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            teacher_id = params.get('id')
            if not teacher_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing id parameter'})}
                
            table.delete_item(Key={'id': teacher_id})
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
            
        else:
            return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Internal server error'})}
