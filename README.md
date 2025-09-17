# ユナメイトAPI v2

ポケモンユナイトの統計データを表示するWebアプリケーションです。試合データの集計・可視化機能を提供します。

## アプリケーション概要

### 機能
- **統計データ表示**: ポケモン別の試合数、勝数、勝率を表示
- **期間選択**: 8日前から1日前までの任意の期間でデータを集計
- **タイプフィルター**: ポケモンのタイプ（アタック型、バランス型など）による絞り込み
- **レスポンシブデザイン**: PC・モバイル両対応のユーザーインターフェース

### 技術スタック

#### フロントエンド
- **React 19.1** + **TypeScript**
- **Tailwind CSS** (レスポンシブUI)
- **Netlify** (自動デプロイ)

#### バックエンド
- **AWS Lambda** + **Python 3.12**
- **AWS API Gateway** (HTTP API)
- **AWS S3** (集計データストレージ)
- **Serverless Framework** (IaC)

## プロジェクト構成

```
unitemate-api-v2/
├── frontend/          # React + TypeScriptフロントエンド
│   ├── src/
│   │   ├── components/    # UI コンポーネント
│   │   ├── types/         # TypeScript型定義
│   │   ├── utils/         # ユーティリティ関数
│   │   └── data/          # ポケモンマスターデータ
│   ├── public/
│   └── package.json
├── backend/           # AWS Lambda バックエンド
│   ├── stats_api.py       # 統計API Lambda関数
│   ├── aggregator.py      # 日次集計処理
│   ├── serverless.yml     # Serverless設定
│   ├── requirements.txt   # Python依存関係
│   └── data/             # マスターデータ
└── README.md
```

## 開発環境セットアップ

### 前提条件
- **Node.js** 18+ (フロントエンド)
- **Python** 3.12+ (バックエンド)
- **uv** (Python パッケージ管理)
- **AWS CLI** 設定済み
- **Serverless Framework**

### フロントエンド開発

```bash
# リポジトリクローン
git clone <repository-url>
cd unitemate-api-v2/frontend

# 依存関係インストール
npm install

# 開発サーバー起動 (http://localhost:3000)
npm start

# ビルド
npm run build

# テスト実行
npm test
```

#### 環境変数設定
開発環境用の`.env.local`ファイルを作成：
```bash
REACT_APP_API_URL=http://localhost:3001  # ローカルAPI
```

### バックエンド開発

```bash
cd unitemate-api-v2/backend

# Python仮想環境作成・依存関係インストール
uv sync

# Serverless Framework依存関係インストール
npm install

# ローカルAPI起動 (http://localhost:3001)
npx serverless offline

# AWS環境変数設定例
export AWS_PROFILE=your-profile
export AWS_REGION=ap-northeast-1
```

#### 必要なAWSリソース
- **S3バケット**: `unitemate-api-v2-aggregated-results-{stage}`
- **DynamoDB**: `unitemate-v2-records-prod` (集計元データ)

## デプロイ方法

### フロントエンド (Netlify)
1. GitHubリポジトリとNetlifyを連携
2. Netlifyの環境変数に以下を設定：
   - `REACT_APP_API_URL`: `https://inr2enz4tk.execute-api.ap-northeast-1.amazonaws.com`
3. `main`ブランチにpushすると自動デプロイ

### バックエンド (AWS Lambda)

#### 開発環境デプロイ
```bash
cd backend
npx serverless deploy --stage dev
```

#### 本番環境デプロイ
```bash
cd backend
npx serverless deploy --stage prod
```

### CORS設定
- 本番フロントエンドドメイン: `https://unitemate-api.shink-poke.com`
- `serverless.yml`の`httpApi.cors.allowedOrigins`で制御

## API仕様

### GET /stats
ポケモン統計データを取得

#### クエリパラメータ
- `start_date` (optional): 開始日 (YYYY-MM-DD, デフォルト: 7日前)
- `end_date` (optional): 終了日 (YYYY-MM-DD, デフォルト: 1日前)

#### レスポンス例
```json
{
  "number_of_games": 1500,
  "start_date": "2024-01-15",
  "end_date": "2024-01-21",
  "result_per_pokemon": [
    {
      "pokemon": "pikachu",
      "number_of_games": 120,
      "number_of_wins": 72
    }
  ]
}
```

## 運用・監視

### ログ確認
```bash
# Lambda関数ログ
npx serverless logs -f getStats --stage prod

# ローカル開発ログ
npx serverless offline --verbose
```

### トラブルシューティング
- **CORS エラー**: `serverless.yml`のallowedOrigins設定確認
- **API接続エラー**: 環境変数`REACT_APP_API_URL`確認
- **データなし**: S3バケット内の集計データ存在確認

## ライセンス
Private

## 開発者
- Backend: Python + AWS Lambda
- Frontend: React + TypeScript + Tailwind CSS