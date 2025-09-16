"""
Serverless handler for unitemate API v2
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from zoneinfo import ZoneInfo

import boto3

from aggregator import aggregate_daily


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
        # クエリパラメータの取得
        query_params = event.get('queryStringParameters') or {}
        start_date_str = query_params.get('start_date')
        end_date_str = query_params.get('end_date')

        # 日付パラメータのバリデーション（デフォルト値設定含む）
        start_date, end_date, actual_start_str, actual_end_str = validate_date_range(start_date_str, end_date_str)

        # S3から指定期間の集計データを取得・統合
        aggregated_data = get_aggregated_data_for_period(start_date, end_date)

        # 純粋な集計データのレスポンス作成
        result = create_simple_response(aggregated_data, actual_start_str, actual_end_str)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            'body': json.dumps(result, ensure_ascii=False)
        }
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
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


def validate_date_range(start_date_str: Optional[str], end_date_str: Optional[str]) -> tuple[datetime, datetime, str, str]:
    """
    日付範囲をバリデーションする

    Args:
        start_date_str: 開始日文字列 (YYYY-MM-DD), 未指定時は7日前
        end_date_str: 終了日文字列 (YYYY-MM-DD), 未指定時は昨日

    Returns:
        バリデーション済みの開始日、終了日、実際の開始日文字列、実際の終了日文字列のタプル

    Raises:
        ValueError: 日付形式が不正、または範囲が要件を満たさない場合
    """
    # 日本時間で現在日時を取得し、デフォルト値を設定
    jst = ZoneInfo("Asia/Tokyo")
    now_jst = datetime.now(jst)
    yesterday = now_jst - timedelta(days=1)
    seven_days_ago = now_jst - timedelta(days=7)

    # デフォルト値の設定
    if not start_date_str:
        start_date_str = seven_days_ago.strftime('%Y-%m-%d')
    if not end_date_str:
        end_date_str = yesterday.strftime('%Y-%m-%d')

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=jst)
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(tzinfo=jst)
    except ValueError:
        raise ValueError("日付形式はYYYY-MM-DD形式で指定してください")

    # バリデーション用の基準日を設定
    eight_days_ago = now_jst - timedelta(days=8)

    # 開始日は8日前から1日前の範囲
    if start_date < eight_days_ago.replace(hour=0, minute=0, second=0, microsecond=0):
        raise ValueError("start_date は最大8日前までです")
    if start_date > yesterday.replace(hour=0, minute=0, second=0, microsecond=0):
        raise ValueError("start_date は最小1日前までです")

    # 終了日は8日前から1日前の範囲
    if end_date < eight_days_ago.replace(hour=0, minute=0, second=0, microsecond=0):
        raise ValueError("end_date は最大8日前までです")
    if end_date > yesterday.replace(hour=0, minute=0, second=0, microsecond=0):
        raise ValueError("end_date は最小1日前までです")

    # 終了日は開始日と同じか未来
    if end_date < start_date:
        raise ValueError("end_date は start_date と同日か未来の日付である必要があります")

    return start_date, end_date, start_date_str, end_date_str


def get_aggregated_data_for_period(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """
    指定期間のS3集計データを取得・統合する

    Args:
        start_date: 開始日
        end_date: 終了日

    Returns:
        統合された集計データ
    """
    s3 = boto3.client('s3')
    bucket_name = os.environ['S3_BUCKET']

    total_games = 0
    pokemon_stats = {}

    # 開始日から終了日まで日ごとにデータを取得
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        s3_key = f"{date_str}/result.json"

        try:
            response = s3.get_object(Bucket=bucket_name, Key=s3_key)
            daily_data = json.loads(response['Body'].read().decode('utf-8'))

            # 全体の試合数を加算
            total_games += daily_data.get('number_of_games', 0)

            # ポケモンごとの統計を統合
            for pokemon_data in daily_data.get('result_per_pokemon', []):
                pokemon_name = pokemon_data['pokemon']
                if pokemon_name not in pokemon_stats:
                    pokemon_stats[pokemon_name] = {
                        'number_of_games': 0,
                        'number_of_wins': 0
                    }
                pokemon_stats[pokemon_name]['number_of_games'] += pokemon_data['number_of_games']
                pokemon_stats[pokemon_name]['number_of_wins'] += pokemon_data['number_of_wins']

        except s3.exceptions.NoSuchKey:
            # ファイルが存在しない場合はスキップ（試合が行われていない日）
            print(f"No data found for {date_str}")
        except Exception as e:
            print(f"Error processing data for {date_str}: {e}")

        current_date += timedelta(days=1)

    return {
        'number_of_games': total_games,
        'result_per_pokemon': [
            {
                'pokemon': pokemon,
                'number_of_games': stats['number_of_games'],
                'number_of_wins': stats['number_of_wins']
            }
            for pokemon, stats in pokemon_stats.items()
        ]
    }


def create_simple_response(aggregated_data: Dict[str, Any], start_date_str: str, end_date_str: str) -> Dict[str, Any]:
    """
    純粋な集計データのレスポンス形式を作成する

    Args:
        aggregated_data: 統合された集計データ
        start_date_str: 開始日文字列
        end_date_str: 終了日文字列

    Returns:
        集計データのみのAPIレスポンス
    """
    # 試合数の多い順にソート
    result_per_pokemon = sorted(
        aggregated_data['result_per_pokemon'],
        key=lambda x: x['number_of_games'],
        reverse=True
    )

    return {
        'number_of_games': aggregated_data['number_of_games'],
        'start_date': start_date_str,
        'end_date': end_date_str,
        'result_per_pokemon': result_per_pokemon
    }


