"""
Serverless handler for unitemate API v2
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List

import boto3
import pandas as pd


def get_stats(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    ポケモンユナイトの統計データを取得するAPIハンドラー

    Args:
        event: APIイベント
        context: Lambda実行コンテキスト

    Returns:
        API レスポンス
    """
    try:
        # TODO: S3から集計データを取得し、期間に応じて統合する処理を実装
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            'body': json.dumps({
                'message': 'Hello from unitemate API v2',
                'event': event
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }


def aggregate_daily(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    DynamoDBから前日のデータを取得し、ポケモンごとの統計を集計してS3に保存する日次バッチ

    Args:
        event: スケジュールイベント
        context: Lambda実行コンテキスト

    Returns:
        処理結果
    """
    try:
        # 前日の日付を取得
        yesterday = datetime.now() - timedelta(days=1)
        aggregated_date = yesterday.strftime('%Y-%m-%d')

        print(f"集計開始: {aggregated_date}")

        # DynamoDBクライアント初期化
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

        # S3クライアント初期化
        s3 = boto3.client('s3')
        bucket_name = os.environ['S3_BUCKET']

        # 前日の開始・終了タイムスタンプを計算
        yesterday_start = int(yesterday.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        yesterday_end = int((yesterday + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())

        print(f"対象期間: {yesterday_start} - {yesterday_end}")

        # DynamoDBから前日のデータを取得
        response = table.scan(
            FilterExpression='#started_date >= :start_date AND #started_date < :end_date',
            ExpressionAttributeNames={
                '#started_date': 'started_date'
            },
            ExpressionAttributeValues={
                ':start_date': yesterday_start,
                ':end_date': yesterday_end
            }
        )

        records = response['Items']

        # ページネーション処理
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#started_date >= :start_date AND #started_date < :end_date',
                ExpressionAttributeNames={
                    '#started_date': 'started_date'
                },
                ExpressionAttributeValues={
                    ':start_date': yesterday_start,
                    ':end_date': yesterday_end
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            records.extend(response['Items'])

        print(f"取得レコード数: {len(records)}")

        if not records:
            print("対象データが見つかりませんでした")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'No data found for aggregation'})
            }

        # pandasでデータ処理
        df = pd.DataFrame(records)

        # winloseを数値に変換
        df['winlose'] = pd.to_numeric(df['winlose'], errors='coerce').fillna(0).astype(int)

        # ポケモンごとの集計
        pokemon_stats = df.groupby('pokemon').agg({
            'winlose': ['count', 'sum']
        }).reset_index()

        # カラム名を整理
        pokemon_stats.columns = ['pokemon', 'number_of_games', 'number_of_wins']

        # 結果をリスト形式に変換
        result_per_pokemon = pokemon_stats.to_dict('records')

        # 全体の統計（試合数はmatch_idのユニーク数）
        total_games = df['match_id'].nunique()

        # 集計結果
        aggregated_result = {
            'number_of_games': total_games,
            'aggregated_date': aggregated_date,
            'result_per_pokemon': result_per_pokemon
        }

        # S3に保存
        s3_key = f"{aggregated_date}/result.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(aggregated_result, ensure_ascii=False),
            ContentType='application/json'
        )

        print(f"集計完了: s3://{bucket_name}/{s3_key}")
        print(f"総試合数: {total_games}, ポケモン種類数: {len(result_per_pokemon)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Aggregation completed successfully',
                'aggregated_date': aggregated_date,
                'total_games': total_games,
                'pokemon_count': len(result_per_pokemon),
                's3_path': f"s3://{bucket_name}/{s3_key}"
            })
        }

    except Exception as e:
        print(f"エラー: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
