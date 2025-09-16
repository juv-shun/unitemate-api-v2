"""
Serverless handler for unitemate API v2
"""
import json
from typing import Dict, Any

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


