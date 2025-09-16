"""
日次集計バッチ処理モジュール
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
from zoneinfo import ZoneInfo

import boto3
import pandas as pd


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
        # 環境変数TARGET_DATEで日付を指定、未設定の場合は日本時間の前日
        target_date_str = os.environ.get('TARGET_DATE')
        jst = ZoneInfo("Asia/Tokyo")

        if target_date_str:
            try:
                # 環境変数から日付を取得
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').replace(tzinfo=jst)
                aggregated_date = target_date_str
                date_source = "環境変数TARGET_DATE"
            except ValueError:
                raise ValueError(f"TARGET_DATE環境変数の形式が不正です。YYYY-MM-DD形式で指定してください: {target_date_str}")
        else:
            # 日本時間で前日の日付を取得
            now_jst = datetime.now(jst)
            target_date = now_jst - timedelta(days=1)
            aggregated_date = target_date.strftime('%Y-%m-%d')
            date_source = "自動計算（前日）"

        print(f"集計開始: {aggregated_date} ({date_source})")

        # DynamoDBクライアント初期化
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

        # S3クライアント初期化
        s3 = boto3.client('s3')
        bucket_name = os.environ['S3_BUCKET']

        # 対象日の開始・終了タイムスタンプを計算
        target_start = int(target_date.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        target_end = int((target_date + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())

        print(f"対象期間: {target_start} - {target_end}")

        # DynamoDBから対象日のデータを取得
        response = table.scan(
            FilterExpression='#started_date >= :start_date AND #started_date < :end_date',
            ExpressionAttributeNames={
                '#started_date': 'started_date'
            },
            ExpressionAttributeValues={
                ':start_date': target_start,
                ':end_date': target_end
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
                    ':start_date': target_start,
                    ':end_date': target_end
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